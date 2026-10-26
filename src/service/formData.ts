
export default function SetFormData(data:object):FormData{
    const form = new FormData();
    Object.entries(data).forEach(([k,v]) =>{
        if(v instanceof Blob)
        {
          form.append(k,v);
        }else 
            if(v !== null && v !== undefined)
             {
            form.append(k,String(v));
        }
    });

    return form;
}
