import type { clientResponse } from "../../Response";
import client from "../Client";

export default async function HavePermission(identifiant:string):Promise<{data:Record<string, unknown> | null | undefined}>{
    const endPoint = `${client.getBaseUrl()}/PermissionUsers/${encodeURIComponent(identifiant)}`;
    const response = await client.get<clientResponse>(endPoint,{
        credentials:"include"
    });
    if(!response.ok) throw new Error(`Erreur de recuperation : ${response.status}`);

    const data = response.data;

    if(!data?.status) throw new Error(`Erreur : ${data?.message}`);

    return {
        data:data.data
    }
}