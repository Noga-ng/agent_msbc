export class ErrorInfo extends Error {
    constructor(message, options) {
        super(message, options);
        this.name = "error_webcam";
    }
    getMessage() {
        return this.message;
    }
    getInfo() {
        return {
            name: this.name,
            message: this.message,
            stack: this.stack,
            cause: this.cause,
        };
    }
}
export default class WebCam {
    streamCamera = null;
    previewUrl = null;
    defaultImg = "";
    requestId = 0;
    capturing = false;
    destroyed = false;
    events = new AbortController();
    video;
    input;
    cameraSelect;
    capture;
    close;
    modal;
    preview;
    viewImg;
    closePreview;
    btnParcr;
    btnOpenModal;
    constructor(ops) {
        this.video = this.requireElement(ops.webCam, HTMLVideoElement);
        this.input = this.requireElement(ops.targetInputId, HTMLInputElement);
        this.cameraSelect = this.requireElement(ops.cameraSelect, HTMLSelectElement);
        this.capture = this.requireElement(ops.captureBtn, HTMLElement);
        this.close = this.requireElement(ops.close, HTMLElement);
        this.modal = this.requireElement(ops.modal, HTMLElement);
        this.preview = this.requireElement(ops.previews, HTMLElement);
        this.viewImg = this.requireElement(ops.viewImg, HTMLImageElement);
        this.closePreview = this.requireElement(ops.closePreview, HTMLElement);
        this.btnOpenModal = this.requireElement(ops.btnOpenModal, HTMLElement);
        this.btnParcr = ops.btnParcr
            ? this.requireElement(ops.btnParcr, HTMLElement)
            : null;
        if (this.input.type !== "file") {
            throw new ErrorInfo("Le champ photo doit être de type file.");
        }
        this.video.muted = true;
        this.video.playsInline = true;
        this.bindEvents();
    }
    requireElement(selector, expectedType) {
        const element = document.querySelector(selector);
        if (!(element instanceof expectedType)) {
            throw new ErrorInfo(`Élément absent ou de type incorrect : ${selector}`);
        }
        return element;
    }
    bindEvents() {
        const options = { signal: this.events.signal };
        this.btnOpenModal.addEventListener("click", (event) => {
            event.preventDefault();
            this.onOpen();
            void this.openCamera().catch((error) => {
                this.reportError(error);
            });
        }, options);
        this.close.addEventListener("click", (event) => {
            event.preventDefault();
            this.closeModal();
        }, options);
        this.cameraSelect.addEventListener("change", () => {
            const deviceId = this.cameraSelect.value;
            if (deviceId) {
                void this.startCamera(deviceId).catch((error) => {
                    this.reportError(error);
                });
            }
        }, options);
        this.capture.addEventListener("click", (event) => {
            event.preventDefault();
            void this.takePhoto().catch((error) => {
                this.reportError(error);
            });
        }, options);
        this.closePreview.addEventListener("click", (event) => {
            event.preventDefault();
            this.clearPreview();
        }, options);
        this.btnParcr?.addEventListener("click", (event) => {
            event.preventDefault();
            this.input.click();
        }, options);
        this.input.addEventListener("change", () => {
            const file = this.input.files?.[0];
            if (!file) {
                this.resetPreview();
                return;
            }
            if (!file.type.startsWith("image/")) {
                this.clearPreview();
                this.reportError(new ErrorInfo("Sélectionne un fichier image."));
                return;
            }
            this.showPreview(file);
        }, options);
        window.addEventListener("pagehide", () => {
            this.closeModal();
        }, options);
    }
    reportError(error) {
        const info = error instanceof ErrorInfo
            ? error
            : new ErrorInfo(error instanceof Error
                ? error.message
                : "Une erreur est survenue avec la caméra.", { cause: error });
        this.modal.dispatchEvent(new CustomEvent("webcam:error", {
            detail: info,
            bubbles: true,
        }));
    }
    releaseStream() {
        this.streamCamera?.getTracks().forEach((track) => {
            track.stop();
        });
        this.streamCamera = null;
        this.video.srcObject = null;
    }
    async startCamera(deviceId) {
        if (this.destroyed) {
            throw new ErrorInfo("Cette instance WebCam a été détruite.");
        }
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new ErrorInfo("Caméra indisponible. Utilise HTTPS ou localhost.");
        }
        this.stopCamera();
        const currentRequest = this.requestId;
        const constraints = {
            audio: false,
            video: deviceId
                ? { deviceId: { exact: deviceId } }
                : { facingMode: { ideal: "environment" } },
        };
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            // La fenêtre a pu être fermée pendant la demande d'accès.
            if (currentRequest !== this.requestId) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }
            this.streamCamera = stream;
            this.video.srcObject = stream;
            await this.video.play();
            if (currentRequest !== this.requestId)
                return;
            await this.cameraList(currentRequest);
        }
        catch (error) {
            // Ignore les résultats d'une ancienne demande.
            if (currentRequest !== this.requestId)
                return;
            this.releaseStream();
            throw new ErrorInfo(error instanceof Error
                ? error.message
                : "Impossible de démarrer la caméra.", { cause: error });
        }
    }
    async cameraList(currentRequest) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (currentRequest !== this.requestId)
            return;
        const cameras = devices.filter((device) => device.kind === "videoinput");
        this.cameraSelect.replaceChildren();
        cameras.forEach((device, index) => {
            const option = document.createElement("option");
            option.value = device.deviceId;
            option.textContent = device.label || `Caméra ${index + 1}`;
            this.cameraSelect.appendChild(option);
        });
        const activeDeviceId = this.streamCamera
            ?.getVideoTracks()[0]
            ?.getSettings()
            .deviceId;
        if (activeDeviceId) {
            this.cameraSelect.value = activeDeviceId;
        }
    }
    async takePhoto() {
        if (this.capturing || this.destroyed)
            return;
        if (!this.streamCamera ||
            this.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
            !this.video.videoWidth ||
            !this.video.videoHeight) {
            throw new ErrorInfo("La caméra n'est pas encore prête. Réessaie dans un instant.");
        }
        this.capturing = true;
        const currentRequest = this.requestId;
        if (this.capture instanceof HTMLButtonElement) {
            this.capture.disabled = true;
        }
        try {
            const canvas = document.createElement("canvas");
            canvas.width = this.video.videoWidth;
            canvas.height = this.video.videoHeight;
            const context = canvas.getContext("2d");
            if (!context) {
                throw new ErrorInfo("Impossible de créer l'image.");
            }
            context.drawImage(this.video, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob((result) => {
                    if (result) {
                        resolve(result);
                    }
                    else {
                        reject(new ErrorInfo("Impossible de convertir la photo."));
                    }
                }, "image/jpeg", 0.9);
            });
            if (currentRequest !== this.requestId)
                return;
            const file = new File([blob], "photo_capture.jpeg", {
                type: "image/jpeg",
                lastModified: Date.now(),
            });
            const transfer = new DataTransfer();
            transfer.items.add(file);
            this.input.files = transfer.files;
            this.showPreview(file);
            this.closeModal();
            // Informe aussi les autres composants du changement.
            this.input.dispatchEvent(new Event("input", { bubbles: true }));
            this.input.dispatchEvent(new Event("change", { bubbles: true }));
        }
        finally {
            this.capturing = false;
            if (this.capture instanceof HTMLButtonElement) {
                this.capture.disabled = false;
            }
        }
    }
    releasePreviewUrl() {
        if (this.previewUrl) {
            URL.revokeObjectURL(this.previewUrl);
            this.previewUrl = null;
        }
    }
    showPreview(file) {
        this.releasePreviewUrl();
        this.previewUrl = URL.createObjectURL(file);
        this.viewImg.src = this.previewUrl;
        this.preview.style.display = "block";
        this.btnOpenModal.style.display = "none";
        if (this.btnParcr) {
            this.btnParcr.style.display = "none";
        }
    }
    resetPreview() {
        this.releasePreviewUrl();
        if (this.defaultImg) {
            this.viewImg.src = this.defaultImg;
        }
        else {
            this.viewImg.removeAttribute("src");
        }
        this.preview.style.display = "none";
        this.btnOpenModal.style.display = "flex";
        if (this.btnParcr) {
            this.btnParcr.style.display = "flex";
        }
    }
    clearPreview() {
        this.input.value = "";
        this.resetPreview();
        this.input.dispatchEvent(new Event("input", { bubbles: true }));
        this.input.dispatchEvent(new Event("change", { bubbles: true }));
    }
    onOpen(display = "flex") {
        this.modal.style.setProperty("display", display, "important");
        return this;
    }
    async openCamera() {
        await this.startCamera();
    }
    stopCamera() {
        // Invalide également les demandes encore en attente.
        this.requestId++;
        this.releaseStream();
    }
    closeModal() {
        this.modal.style.setProperty("display", "none", "important");
        this.stopCamera();
    }
    defaultImgPreview(img) {
        this.defaultImg = img;
        if (!this.previewUrl) {
            this.viewImg.src = img;
        }
        return this;
    }
    destroy() {
        this.destroyed = true;
        this.events.abort();
        this.closeModal();
        this.resetPreview();
    }
}
export class WebCamElement {
    static _instance;
    CamStyle = `<style type="text/css">.ModalPhoto{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;padding:20px;background:radial-gradient(circle at top,rgba(30,41,59,.72),rgba(2,6,23,.92));
   backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
   .camera-dialog{position:relative;width:min(100%,720px);overflow:hidden;background:#fff;border-radius:24px;box-shadow:0 30px 80px rgba(0,0,0,.4),0 0 0 1px rgba(255,255,255,.08);animation:webcamOpen .25s ease}
   @keyframes webcamOpen{from{opacity:0;transform:translateY(15px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
   .camera-header{min-height:72px;display:flex;align-items:center;justify-content:space-between;gap:15px;padding:14px 18px 14px 20px;background:#fff;border-bottom:1px solid #edf0f4}
   .camera-title{display:flex;align-items:center;gap:12px}.camera-title-icon{width:42px;height:42px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border-radius:13px;background:#eef8f2;color:#16803c;font-size:18px}
   .camera-title-text h2{margin:0;color:#172033;font-size:17px;font-weight:700}.camera-title-text p{margin:3px 0 0;color:#8a94a6;font-size:12px}
   .camera-close{width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:none;outline:none;border-radius:50%;background:#f4f5f7;color:#667085;cursor:pointer;transition:.2s ease}
   .camera-close:hover{background:#feecec;color:#d92d20;transform:rotate(5deg)}.camera-close i,.camera-close svg{font-size:18px}.video-webcam{position:relative;width:100%;aspect-ratio:16/10;overflow:hidden;background:#05070b}
   #webcam{display:block;width:100%;height:100%;object-fit:cover;background:#05070b}.camera-video-overlay{pointer-events:none;position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.12),transparent 30%,transparent 65%,rgba(0,0,0,.48))}
   .camera-status{position:absolute;top:16px;left:16px;display:flex;align-items:center;gap:7px;padding:7px 11px;border-radius:30px;background:rgba(0,0,0,.48);color:#fff;font-size:11px;font-weight:600;backdrop-filter:blur(8px)}
   .camera-status-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.15)}.choix{position:absolute;right:16px;top:16px;z-index:5}.choix-wrapper{position:relative;display:flex;align-items:center}
   .choix-wrapper>i{position:absolute;left:12px;z-index:2;pointer-events:none;color:#fff;font-size:12px}.choix select{width:190px;padding:9px 34px;border:1px solid rgba(255,255,255,.17);outline:none;border-radius:10px;appearance:none;
   -webkit-appearance:none;background:rgba(0,0,0,.48);color:#fff;font-size:12px;font-weight:500;cursor:pointer;backdrop-filter:blur(10px);transition:.2s ease}
   .choix select:hover{background:rgba(0,0,0,.65)}.choix select option{color:#111827;background:#fff}.select-arrow{position:absolute;right:12px!important;left:auto!important;pointer-events:none;color:#fff;font-size:10px}
   .capture-zone{position:absolute;left:50%;bottom:24px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:7px;z-index:10}
   .shot-Image{position:relative;width:68px;height:68px;display:flex;align-items:center;justify-content:center;padding:0;border:4px solid rgba(255,255,255,.94);outline:none;border-radius:50%;
   background:rgba(255,255,255,.22);box-shadow:0 5px 20px rgba(0,0,0,.28);cursor:pointer;transition:.18s ease}
   .shot-Image:before{content:"";width:50px;height:50px;border-radius:50%;background:#fff;transition:.18s ease}.shot-Image:hover{transform:scale(1.07);background:rgba(22,128,60,.3)}.shot-Image:hover:before{transform:scale(.91);background:#eaf7ef}
   .shot-Image:active{transform:scale(.94)}.capture-label{color:rgba(255,255,255,.9);font-size:11px;font-weight:500;text-shadow:0 1px 5px rgba(0,0,0,.5)}
   .camera-footer{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:13px 20px;background:#fff;color:#7d8798;font-size:11px}.camera-footer-info{display:flex;align-items:center;gap:7px}.camera-footer-info i{color:#16803c}
   .Canva{position:relative;display:none;width:130px;height:118px;overflow:hidden;border-radius:12px;background:#f3f4f6}#closePreview{position:absolute;right:5px;top:5px;z-index:99}
   #closePreview svg,#closePreview i{color:#ef4444;font-size:1.3rem;cursor:pointer;transition:.2s ease}#closePreview:hover svg,#closePreview:hover i{color:#b91c1c;transform:scale(1.08)}
   .btn-photo{position:relative;display:flex;align-items:center;justify-content:center;gap:8px;margin-left:auto;padding:10px 15px;border:0;border-radius:9px;background:#667085;color:#fff;cursor:pointer;transition:.2s ease}
   .btn-photo:hover,.open-webcam:hover{background:#475467}@media(max-width:650px){.ModalPhoto{padding:0;align-items:flex-end}.camera-dialog{width:100%;border-radius:24px 24px 0 0}.camera-header{min-height:65px;padding:12px 15px}
   .camera-title-icon{width:38px;height:38px}.camera-title-text h2{font-size:15px}.camera-title-text p{display:none}.video-webcam{aspect-ratio:3/4;max-height:70vh}.choix{top:12px;right:12px}.choix select{width:145px;font-size:11px}.capture-zone{bottom:20px}
   .shot-Image{width:66px;height:66px}.shot-Image:before{width:48px;height:48px}.camera-footer{padding:12px 15px}}@media(max-width:420px){.camera-status{top:12px;left:12px;padding:6px 9px;font-size:10px}
   .choix select{width:130px;padding-left:30px}.camera-footer{justify-content:center;text-align:center}}</style>`;
    camBody = `<div class="ModalPhoto" style="display:none" role="dialog" aria-modal="true" aria-labelledby="cameraModalTitle"><div class="camera-dialog"><div class="camera-header">
<div class="camera-title"><div class="camera-title-icon"><i class="fa-solid fa-camera"></i></div><div class="camera-title-text"><h2 id="cameraModalTitle">Prendre une photo</h2>
<p>Positionnez correctement la personne face à la caméra</p></div></div><button type="button" id="CloseWebCam" class="camera-close" aria-label="Fermer la caméra" title="Fermer"><i class="fa-solid fa-xmark"></i>
</button></div><div class="video-webcam"><video id="webcam" autoplay playsinline muted></video><div class="camera-video-overlay"></div><div class="camera-status"><span class="camera-status-dot"></span>Caméra active</div>
<div class="choix"><div class="choix-wrapper"><i class="fa-solid fa-video"></i><select id="cameraSelected" aria-label="Choisir une caméra" title="Choisir une caméra"></select><i class="fa-solid fa-chevron-down select-arrow"></i></div>
</div><div class="capture-zone"><button type="button" class="shot-Image" id="captureBtn" aria-label="Prendre la photo" title="Prendre la photo"></button><span class="capture-label">Prendre la photo</span></div></div><div class="camera-footer">
<div class="camera-footer-info"><i class="fa-solid fa-circle-info"></i><span>Regardez l'objectif et restez immobile pendant la capture</span></div></div></div></div>`;
    static get instance() {
        return (this._instance ??= new WebCamElement());
    }
    inject() {
        if (!document.getElementById("webcam-style")) {
            document.head.insertAdjacentHTML("beforeend", this.CamStyle);
        }
        if (!document.querySelector(".ModalPhoto")) {
            document.body.insertAdjacentHTML("beforeend", this.camBody);
        }
    }
    getModal() {
        return {
            style: this.CamStyle,
            modal: this.camBody,
        };
    }
}
