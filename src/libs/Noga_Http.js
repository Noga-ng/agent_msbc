export class ReqError extends Error {
    status;
    response;
    data;
    constructor(message, status = null, response = null, data = null) {
        super(message);
        this.name = "ReqError";
        this.status = status;
        this.response = response;
        this.data = data;
    }
}
// class abortRace
class AbortRace {
    controller = new AbortController();
    signal = this.controller.signal;
    cleanups = [];
    constructor(signals) {
        for (const s of signals) {
            if (!s)
                continue;
            if (s.aborted) {
                this.controller.abort();
                return;
            }
            const fn = () => this.controller.abort();
            s.addEventListener("abort", fn);
            this.cleanups.push(() => s.removeEventListener("abort", fn));
        }
    }
    cleanup() {
        this.cleanups.forEach(f => f());
    }
}
export class httpClient {
    static _instance;
    static get instance() {
        if (!this._instance)
            this._instance = new httpClient();
        return this._instance;
    }
    baseUrl = "";
    token = null;
    defaultTimeout = 10000;
    defaultRetries = 0;
    defaultRetryDelay = 300;
    cache = new Map();
    reqInterceptors = [];
    resInterceptors = [];
    constructor() { }
    setBaseUrl(baseUrl) {
        this.baseUrl = baseUrl;
        return this;
    }
    setToken(token) {
        this.token = token;
        return this;
    }
    getBaseUrl() {
        return this.baseUrl;
    }
    useReq(i) {
        this.reqInterceptors.push(i);
    }
    useRes(i) {
        this.resInterceptors.push(i);
    }
    isFormData(v) {
        return typeof FormData !== "undefined" && v instanceof FormData;
    }
    sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
    cacheKey(o) {
        return `${o.method}:${o.link}:${JSON.stringify(Object.keys(o.data ?? {})
            .sort()
            .reduce((acc, k) => {
            acc[k] = o.data[k];
            return acc;
        }, {}))}`;
    }
    async request(opts) {
        let o = {
            link: opts.link,
            method: opts.method ?? "GET",
            data: opts.data,
            headers: opts.headers ?? {},
            credentials: opts.credentials ?? "include",
            timeout: opts.timeout ?? this.defaultTimeout,
            retries: opts.retries ?? this.defaultRetries,
            retryDelay: opts.retryDelay ?? this.defaultRetryDelay,
            cache: opts.cache ?? false,
            signal: opts.signal,
            expectJson: opts.expectJson ?? true
        };
        for (const i of this.reqInterceptors) {
            o = await i(o);
        }
        let url = this.baseUrl + o.link;
        if (o.method === "GET" && o.data) {
            url += "?" + new URLSearchParams(o.data).toString();
        }
        const key = this.cacheKey(o);
        if (o.method === "GET" && o.cache && this.cache.has(key)) {
            return {
                status: 200,
                ok: true,
                data: structuredClone(this.cache.get(key)),
                headers: new Headers()
            };
        }
        if (this.token) {
            o = {
                ...o,
                headers: {
                    ...o.headers,
                    ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
                }
            };
        }
        if (!this.isFormData(o.data) && o.method !== "GET" && o.data != null) {
            o.headers["Content-Type"] ??= "application/json";
        }
        let lastError;
        for (let attempt = 0; attempt <= o.retries; attempt++) {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), o.timeout);
            const race = new AbortRace([ctrl.signal, o.signal]);
            try {
                const res = await fetch(url, {
                    method: o.method,
                    headers: o.headers,
                    credentials: o.credentials ?? "include",
                    signal: race.signal,
                    body: o.method === "GET"
                        ? undefined
                        : this.isFormData(o.data)
                            ? o.data
                            : JSON.stringify(o.data)
                });
                let out = {
                    status: res.status,
                    ok: res.ok,
                    data: undefined,
                    headers: res.headers
                };
                if (o.expectJson && res.headers.get("content-type")?.includes("json")) {
                    out.data = await res.json();
                }
                else {
                    out.data = await res.text().catch(() => null);
                }
                for (const ri of this.resInterceptors) {
                    out = await ri(out);
                }
                //  5xx = erreur serveur → exception
                if (!out.ok && out.status >= 500) {
                    throw new ReqError("Server error", out.status, res, out.data);
                }
                //  2xx /  4xx → on retourne la réponse
                if (o.method === "GET" && o.cache && out.ok) {
                    this.cache.set(key, structuredClone(out.data));
                }
                return out;
            }
            catch (e) {
                lastError = e;
                // abort = on stop tout
                if (e.name === "AbortError")
                    throw e;
                // pas de retry sur 4xx
                if (e instanceof ReqError && e.status && e.status < 500) {
                    throw e;
                }
                if (attempt < o.retries) {
                    await this.sleep(o.retryDelay * 0 ** attempt);
                }
            }
            finally {
                clearTimeout(timer);
                race.cleanup();
            }
        }
        if (lastError instanceof ReqError)
            throw lastError;
        throw new ReqError(lastError?.message ?? "Network error");
    }
    get(link, opts) {
        return this.request({ ...opts, link, method: "GET" });
    }
    post(link, data, opts) {
        return this.request({ ...opts, link, data, method: "POST" });
    }
    put(link, data, opts) {
        return this.request({ ...opts, link, data, method: "PUT" });
    }
    delete(link, data, opts) {
        return this.request({ ...opts, link, data, method: "DELETE" });
    }
    clearCache() {
        this.cache.clear();
    }
}
const http = httpClient.instance;
export default http;
