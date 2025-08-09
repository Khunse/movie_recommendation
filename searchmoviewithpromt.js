import {InferenceClient} from "@huggingface/inference"
import { QdrantClient} from '@qdrant/js-client-rest';
import { configDotenv } from "dotenv";

configDotenv();

const searchinput = `I'm looking for a suspenseful thriller movie featuring a detective who unravels a complex mystery, with lots of plot twists and a dark, moody atmosphere.`;

try {

    const client = new InferenceClient( process.env.HUGGINGFACE_API_KEY);

        const output = await client.featureExtraction(
            {
                model: 'intfloat/multilingual-e5-large',
                inputs: searchinput,
                provider: 'hf-inference',
            }
        );
    

          const qclient = new QdrantClient({
            url: process.env.QDRANT_URL,
            apiKey: process.env.QDRANT_API_KEY
        });

        const result = await qclient.search('movieslist', {
            vector: output,
            limit: 5
        });

        // console.log('result matched list :: ',result.map(w => w.payload.title));
        console.log('result matched list :: ',result);
    } catch (error) {
        console.error(error);
    }