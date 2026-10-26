
/**
 * 
 * @param {File} file 
 * @param {number} maxW default values 1280
 * @param {number} maxH default values 720
 * @param {number} quality default values 0.8 
 * @returns {Promise<Blob | null>}
 */
export default async function ResizeImg(
    file: File,
    maxW: number = 1280,
    maxH: number = 720,
    quality: number = 0.8
): Promise<File | null> {

    if (!file) {
        return null;
    }

    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Seuls JPG, PNG et WebP sont acceptés.");
    const maxMb = 5;
    const maxBytes = maxMb * 1024 * 1024;

    if (file.size > maxBytes) {
        throw new Error(
            `Photo trop volumineuse (maximum ${maxMb} Mo).`
        );
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    try {
        img.src = url;
        await img.decode();
    } finally {
        URL.revokeObjectURL(url);
    }

    let { width, height } = img;

    if (width > maxW || height > maxH) {
        const ratio = Math.min(
            maxW / width,
            maxH / height
        );

        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error(
            'Impossible de créer le contexte Canvas.'
        );
    }

    // Évite qu'une transparence PNG/WebP devienne noire lors de la conversion JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(
        img,
        0,
        0,
        width,
        height
    );

   return new Promise<File | null>((resolve) => {
    canvas.toBlob(
        (blob) => {
            if (!blob) {
                resolve(null);
                return;
            }

            const files = new File(
                [blob],
                (file.name.replace(/\.[^.]+$/, "") || "photo") + ".jpg",
                {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                }
            );

            resolve(files);
        },
        'image/jpeg',
        quality
    );
});
}


export function PhotoUrl(photo: File | null): Promise<string | null> {
    if (photo === null) {
        return Promise.resolve(null);
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result as string);
        };

        reader.onerror = () => {
            reject(reader.error);
        };

        reader.readAsDataURL(photo);
    });
}