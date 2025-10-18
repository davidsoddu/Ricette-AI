import { GoogleGenAI, Type } from "@google/genai";

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

const buildContentParts = async (text: string, image: File | null) => {
    const contentParts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [];
    if (image) {
        const imageBase64 = await fileToBase64(image);
        contentParts.push({
          inlineData: {
            mimeType: image.type,
            data: imageBase64
          }
        });
      }
    return contentParts;
}

export const generateRecipeIdeas = async (text: string, image: File | null, dietaryPreferences: string, prepTime: string) => {
    if (!process.env.API_KEY) {
        throw new Error("La chiave API di Gemini non è configurata.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    if (!text.trim() && !image) {
        throw new Error("Fornisci almeno un ingrediente in formato testo o un'immagine.");
    }

    const contentParts = await buildContentParts(text, image);

    const systemInstruction = `Sei un assistente culinario creativo. Il tuo compito è suggerire idee per ricette basandoti sugli ingredienti e le preferenze fornite.
- Rispondi sempre e solo in italiano.
- Fornisci una lista di 3-5 nomi di ricette che rispettino le preferenze dietetiche e i tempi di preparazione indicati.
- Per ogni ricetta, fornisci una breve e accattivante descrizione (massimo 15 parole).
- Formatta la tua risposta esclusivamente come un oggetto JSON che rispetti lo schema fornito. Non aggiungere testo prima o dopo il JSON.`;

    let promptText = "Suggerisci alcune ricette ";
    if (image) {
      promptText += "con gli ingredienti che vedi nell'immagine";
      if (text.trim()) {
        promptText += ` e anche con i seguenti: ${text}`;
      }
    } else {
      promptText += `con i seguenti ingredienti: ${text}`;
    }

    const constraints = [];
    if (dietaryPreferences.trim()) {
        constraints.push(`deve essere ${dietaryPreferences}`);
    }
    if (prepTime.trim()) {
        constraints.push(`preparabile in massimo ${prepTime}`);
    }

    if (constraints.length > 0) {
        promptText += `. La ricetta ${constraints.join(' e ')}.`;
    } else {
        promptText += '.';
    }

    contentParts.push({ text: promptText });

    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: contentParts },
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    ideas: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                recipeName: { type: Type.STRING, description: "Nome della ricetta" },
                                description: { type: Type.STRING, description: "Breve descrizione della ricetta" }
                            },
                            required: ['recipeName', 'description']
                        }
                    }
                },
                required: ['ideas']
            }
        }
    });
    
    const jsonString = result.text.trim();
    const parsed = JSON.parse(jsonString);
    return parsed.ideas as { recipeName: string, description: string }[];
};

export const generateFullRecipe = async (recipeName: string, text: string, image: File | null, dietaryPreferences: string, prepTime: string) => {
    if (!process.env.API_KEY) {
        throw new Error("La chiave API di Gemini non è configurata.");
      }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const contentParts = await buildContentParts(text, image);

    const systemInstruction = `Sei un esperto chef di fama mondiale. Il tuo compito è creare una ricetta deliziosa e facile da seguire basandoti sugli ingredienti, il nome del piatto scelto e le preferenze dell'utente.
- Rispondi sempre e solo in italiano.
- La ricetta deve rispettare le preferenze dietetiche e i tempi di preparazione massimi indicati dall'utente.
- Inizia con il nome del piatto scelto come titolo principale.
- Elenca tutti gli ingredienti necessari (quelli forniti e quelli che presumi siano disponibili in una cucina standard come olio, sale, pepe).
- Fornisci istruzioni chiare, passo dopo passo.
- Includi i tempi di preparazione e cottura. Il tempo di preparazione totale non deve superare il massimo indicato.
- Se possibile, aggiungi una sezione con suggerimenti o varianti.
- Formatta la tua risposta utilizzando Markdown (ad esempio, '# Nome Piatto', '## Ingredienti', '* Elemento della lista').`;
      
    let promptText = `Crea una ricetta completa e dettagliata per "${recipeName}" `;
    if (image) {
        promptText += "usando gli ingredienti che vedi nell'immagine";
        if (text.trim()) {
            promptText += ` e anche i seguenti: ${text}`;
        }
    } else {
        promptText += `usando i seguenti ingredienti: ${text}`;
    }

    const constraints = [];
    if (dietaryPreferences.trim()) {
        constraints.push(`deve essere ${dietaryPreferences}`);
    }
    if (prepTime.trim()) {
        constraints.push(`preparabile in massimo ${prepTime}`);
    }
    
    if (constraints.length > 0) {
        promptText += `. Assicurati che la ricetta ${constraints.join(' e ')}.`;
    } else {
        promptText += '.';
    }

    contentParts.push({ text: promptText });

    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: contentParts },
        config: {
            systemInstruction
        }
    });

    return result.text;
};