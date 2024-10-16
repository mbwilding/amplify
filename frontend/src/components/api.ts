import { apiUrl } from '../config'

export async function fetchApi(call?: string) {
    const response = await fetch(apiUrl + call, {
        mode: 'no-cors'
    });

    const data = await response.json();
    console.log(data);

    return response;
}
