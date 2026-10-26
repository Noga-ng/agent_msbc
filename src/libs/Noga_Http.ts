/* eslint-disable @typescript-eslint/no-explicit-any */
export type ReqMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type CredentialsModes = "include"|"omit"|"same-origin";

export interface ReqOptions {
    link: string;
    method?: ReqMethod;
    data?: any;
    headers?: Record<string, string>;
    credentials?:CredentialsModes,
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    cache?: boolean;
    signal?: AbortSignal;
    expectJson?: boolean;
}

export interface ResW<T = unknown> {
    status: number;
    ok: boolean;
    data?: T;
    headers: Headers;
}

export class ReqError extends Error {
    status: number | null;
    response: Response | null;
    data: any;

    constructor(message: string, status: number | null = null, response: Response | null = null, data: any = null) {
        super(message);
        this.name = "ReqError";
        this.status = status;
        this.response = response;
        this.data = data;
    }
}

type NormalizedReqOptions = {
    link: string;
    method: ReqMethod;
    data?: any;
    headers: Record<string, string>;
    credentials:CredentialsModes,
    timeout: number;
    retries: number;
    retryDelay: number;
    cache: boolean;
    signal?: AbortSignal;
    expectJson: boolean;
};

export type ReqInterceptor =
    (o: NormalizedReqOptions) =>
        NormalizedReqOptions | Promise<NormalizedReqOptions>;

export type ResInterceptor =
    <T>(r: ResW<T>) =>
        ResW<T> | Promise<ResW<T>>;

// class abortRace
   class AbortRace {
    controller = new AbortController();
    signal = this.controller.signal;
    private cleanups: (() => void)[] = [];

    constructor(signals: (AbortSignal | undefined)[]) {
        for (const s of signals) {
            if (!s) continue;
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
    private static _instance: httpClient;

    static get instance() {
        if (!this._instance) this._instance = new httpClient();
        return this._instance;
    }

    private baseUrl = "";
    private token: string | null = null;

    private defaultTimeout = 10000;
    private defaultRetries = 0;
    private defaultRetryDelay = 300;

    private cache = new Map<string, any>();
    private reqInterceptors: ReqInterceptor[] = [];
    private resInterceptors: ResInterceptor[] = [];

    private constructor() {}

    setBaseUrl(baseUrl:string):this{
      this.baseUrl = baseUrl;
      return this;
    }

    setToken(token:string):this{
      this.token =  token;
      return this;
    }

    public getBaseUrl():string{
      return this.baseUrl;
    }

    useReq(i: ReqInterceptor) {
        this.reqInterceptors.push(i);
    }

    useRes(i: ResInterceptor) {
        this.resInterceptors.push(i);
    }

    private isFormData(v: any): v is FormData {
        return typeof FormData !== "undefined" && v instanceof FormData;
    }

    private sleep(ms: number) {
        return new Promise(r => setTimeout(r, ms));
    }

   private cacheKey(o: NormalizedReqOptions) {
    return `${o.method}:${o.link}:${JSON.stringify(
    Object.keys(o.data ?? {})
      .sort()
      .reduce((acc, k) => {
        acc[k] = o.data[k];
        return acc;
      }, {} as any)
  )}`;
   }

  private async request<T>(opts: ReqOptions): Promise<ResW<T>> {

  let o: NormalizedReqOptions = {
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

  let lastError: any;

  const retryCount = ["GET", "HEAD", "OPTIONS"].includes(o.method) ? o.retries : 0;
  for (let attempt = 0; attempt <= retryCount; attempt++) {

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), o.timeout);
    const race = new AbortRace([ctrl.signal, o.signal]);

    try {
      const res = await fetch(url, {
        method: o.method,
        headers: o.headers,
        credentials:o.credentials ?? "include",
        signal: race.signal,
        body:
          o.method === "GET"
            ? undefined
            : this.isFormData(o.data)
            ? o.data
            : JSON.stringify(o.data)
      });

      if (res.status === 401 && o.link !== "/auth/session" && o.link !== "/connection") {
        window.dispatchEvent(new Event("auth:unauthorized"));
      }

      let out: ResW<T> = {
        status: res.status,
        ok: res.ok,
        data: undefined,
        headers: res.headers
      };

      if (o.expectJson && res.headers.get("content-type")?.includes("json")) {
        out.data = await res.json();
      } else {
        out.data = await res.text().catch(() => null) as any;
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

    } catch (e: any) {
      lastError = e;

      // abort = on stop tout
      if (e.name === "AbortError") throw e;

      // pas de retry sur 4xx
      if (e instanceof ReqError && e.status && e.status < 500) {
        throw e;
      }

      if (attempt < retryCount) {
        await this.sleep(o.retryDelay * 2 ** attempt);
      }

    } finally {
      clearTimeout(timer);
      race.cleanup();
    }
  }

  if (lastError instanceof ReqError) throw lastError;
  throw new ReqError(lastError?.message ?? "Network error");
}


get<T>(link: string, opts?: Partial<ReqOptions>) {
        return this.request<T>({ ...opts, link, method: "GET" });
    }

post<T>(link: string, data: any, opts?: Partial<ReqOptions>) {
        return this.request<T>({ ...opts, link, data, method: "POST" });
    }

put<T>(link: string, data: any, opts?: Partial<ReqOptions>) {
        return this.request<T>({ ...opts, link, data, method: "PUT" });
    }

delete<T>(link: string, data?: any, opts?: Partial<ReqOptions>) {
        return this.request<T>({ ...opts, link, data, method: "DELETE" });
    }

clearCache() {
        this.cache.clear();
    }
}

const http = httpClient.instance;

export default http;