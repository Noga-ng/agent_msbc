import type { Response } from "../../components/Inscriptions/Inputs/TypeInput";
import { ReqError } from "../../libs/Noga_Http";
import type { clientResponse } from "../../Response";
import client from "../Client";

export interface SendInterface {
    endpoint:string;
    payload:object;
    signal:AbortSignal;
}

function isApiResponse(value: unknown): value is clientResponse {
  if (!value || typeof value !== 'object') return false;
  const result = value as Record<string, unknown>;
  return typeof result.status === 'boolean'
    && (result.message === undefined || typeof result.message === 'string')
    && (result.data === undefined || result.data === null
      || (typeof result.data === 'object' && !Array.isArray(result.data)));
}

export default async function send<T = Response>({endpoint,payload,signal}:SendInterface):Promise<clientResponse>{
    try{

    const response = await client.post<T>(`/${endpoint.replace(/^\/+/, '')}`,payload,{credentials:"include",signal:signal});
  
    if (response.status === 401 || response.status === 403) {
      throw new Error('Connexion refusée. Vérifiez vos identifiants.');
    }

    if (response.status === 429) {
      throw new Error('Trop de tentatives. Patientez un instant avant de réessayer.');
    }

    if (!response.ok) {
      throw new Error('Le service ne répond pas correctement. Veuillez réessayer plus tard.');
    }
    const result = response.data;
    if (!isApiResponse(result) || result.status !== true) {
      throw new Error('La demande n’a pas pu être validée. Vérifiez les informations saisies.');
    }

    return {
         status: true, 
         message: result.message, 
         data: result.data 
        };

  } catch (error) {

    if (signal?.aborted) throw signal.reason;

    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new Error('Le service met trop de temps à répondre. Veuillez réessayer.', { cause: error });
    }

    if (error instanceof ReqError && error.status !== null && error.status >= 500) {
      throw new Error('Le service ne répond pas correctement. Veuillez réessayer plus tard.', { cause: error });
    }

    if (error instanceof ReqError || error instanceof TypeError || error instanceof SyntaxError) {
      throw new Error('Impossible de joindre le service. Veuillez réessayer.', { cause: error });
    }

    throw error;
}
}