import {InferenceClient} from "@huggingface/inference"
import { QdrantClient} from '@qdrant/js-client-rest';
import { randomUUID } from "crypto";
import { configDotenv } from "dotenv";

configDotenv();

const url = process.env.RAPIDAPI_IMDB_URL;
const options = {
	method: 'GET',
	headers: {
		'x-rapidapi-key': process.env.RAPIDAPI_KEY,
		'x-rapidapi-host': process.env.RAPIDAPI_HOST
	}
};

try {
	const response = await fetch(url, options);
	const result = await response.text();
    const jdata = JSON.parse(result);
    const moviedesc = jdata.results.filter(w => w.description != null && w.primaryTitle != null).map(w => { return { description: w.description, title: w.primaryTitle }; });


	console.log("moviedesc nextcursor : : ", jdata.nextCursorMark);

    const movidedescembedded = [];
    if(moviedesc.length > 0){

        await Promise.all(moviedesc.map(async (desc) => {
            const client = new InferenceClient( process.env.HUGGINGFACE_API_KEY);

        const output = await client.featureExtraction(
            {
                model: 'intfloat/multilingual-e5-large',
                inputs: desc.description,
                provider: 'hf-inference',
            }
        );

        // console.log('embedded output:',output );
        movidedescembedded.push({ vector: output, title: desc.title, description: desc.description});
    }));

        const qclient = new QdrantClient({
            url: process.env.QDRANT_URL,
            apiKey: process.env.QDRANT_API_KEY
        });
        
        console.log('movies :: ',movidedescembedded.length);

            if(movidedescembedded.length > 0){
            movidedescembedded.forEach((data,indx,arr) => {
                arr[indx]  = {
                    id: randomUUID(),
                    vector: data.vector,
                    payload: {
                        title: data.title,
                        description: data.description
                    }
                }
            });

            const insetresult = await qclient.upsert('movieslist', {
                points: movidedescembedded
            });
    
            console.log('insert result:', insetresult);

                }
            }
    

} catch (error) {
	console.error(error);
}