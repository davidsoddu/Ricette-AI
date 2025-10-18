
import React, { useState, useRef } from 'react';
import { generateRecipeIdeas, generateFullRecipe } from './services/geminiService';
import { CameraIcon, SparklesIcon, LoadingSpinner, CopyIcon, CheckIcon } from './components/icons';
import MarkdownRenderer from './components/MarkdownRenderer';

type RecipeIdea = {
  recipeName: string;
  description: string;
};

const App: React.FC = () => {
  const [ingredientsText, setIngredientsText] = useState('');
  const [ingredientsImage, setIngredientsImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dietaryPreferences, setDietaryPreferences] = useState('');
  const [prepTime, setPrepTime] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recipeIdeas, setRecipeIdeas] = useState<RecipeIdea[] | null>(null);
  const [selectedRecipeName, setSelectedRecipeName] = useState<string | null>(null);
  const [fullRecipe, setFullRecipe] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setIngredientsImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      event.target.value = ''; // Reset file input
    }
  };

  const removeImage = () => {
    setIngredientsImage(null);
    setImagePreview(null);
  };

  const handleGenerateIdeas = async () => {
    if (!ingredientsText.trim() && !ingredientsImage) {
      setError("Per favore, inserisci almeno un ingrediente o carica un'immagine.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setRecipeIdeas(null);
    setFullRecipe(null);
    setSelectedRecipeName(null);

    try {
      const ideas = await generateRecipeIdeas(ingredientsText, ingredientsImage, dietaryPreferences, prepTime);
      setRecipeIdeas(ideas);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Si è verificato un errore sconosciuto.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRecipe = async (recipeName: string) => {
    setIsLoading(true);
    setError(null);
    setFullRecipe(null);
    setSelectedRecipeName(recipeName);

    try {
      const recipe = await generateFullRecipe(recipeName, ingredientsText, ingredientsImage, dietaryPreferences, prepTime);
      setFullRecipe(recipe);
      window.scrollTo(0, 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Si è verificato un errore sconosciuto durante la generazione della ricetta.");
      setSelectedRecipeName(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (fullRecipe) {
      navigator.clipboard.writeText(fullRecipe).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  const resetState = () => {
    setIngredientsText('');
    setIngredientsImage(null);
    setImagePreview(null);
    setDietaryPreferences('');
    setPrepTime('');
    setIsLoading(false);
    setError(null);
    setRecipeIdeas(null);
    setSelectedRecipeName(null);
    setFullRecipe(null);
  };

  const handleBackToIdeas = () => {
    setFullRecipe(null);
    setSelectedRecipeName(null);
  };

  const renderInitialForm = () => (
    <div className="w-full max-w-2xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-2">Chef AI</h1>
      <p className="text-lg text-gray-300 text-center mb-8">Trasforma i tuoi ingredienti in capolavori culinari.</p>

      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg space-y-6">
        <div>
          <label htmlFor="ingredients" className="block text-sm font-medium text-gray-300 mb-2">
            Quali ingredienti hai a disposizione?
          </label>
          <textarea
            id="ingredients"
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            placeholder="Es. pomodori, basilico, aglio, pasta..."
            className="w-full h-28 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
          />
        </div>

        <div className="text-center text-gray-400">oppure</div>

        <div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center p-4 bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:bg-gray-600 hover:border-gray-500 transition"
          >
            <CameraIcon />
            <span>Carica una foto degli ingredienti</span>
          </button>
          {imagePreview && (
            <div className="mt-4 relative inline-block">
              <img src={imagePreview} alt="Anteprima ingredienti" className="h-32 w-32 object-cover rounded-lg" />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold"
              >
                &times;
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="diet" className="block text-sm font-medium text-gray-300 mb-2">Preferenze dietetiche</label>
            <select
              id="diet"
              value={dietaryPreferences}
              onChange={(e) => setDietaryPreferences(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
            >
              <option value="">Nessuna</option>
              <option value="vegetariana">Vegetariano</option>
              <option value="vegana">Vegano</option>
              <option value="senza glutine">Senza glutine</option>
              <option value="senza lattosio">Senza lattosio</option>
            </select>
          </div>
          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-300 mb-2">Tempo di preparazione max</label>
            <select
              id="time"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
            >
              <option value="">Qualsiasi</option>
              <option value="15 minuti">15 minuti</option>
              <option value="30 minuti">30 minuti</option>
              <option value="45 minuti">45 minuti</option>
              <option value="1 ora">1 ora</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerateIdeas}
          disabled={isLoading}
          className="w-full flex items-center justify-center p-4 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <SparklesIcon />
              <span>Trova Idee per Ricette</span>
            </>
          )}
        </button>

        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
      </div>
    </div>
  );
  
  const renderRecipeIdeas = () => (
    <div className="w-full max-w-3xl mx-auto">
      <button onClick={resetState} className="text-teal-400 hover:text-teal-300 mb-6">&larr; Inizia una nuova ricerca</button>
      <h2 className="text-3xl font-bold text-white text-center mb-6">Ecco qualche idea per te!</h2>
      <div className="space-y-4">
        {recipeIdeas?.map((idea, index) => (
          <div key={index} className="bg-gray-800 p-6 rounded-lg shadow-md transition-transform hover:scale-105">
            <h3 className="text-xl font-semibold text-teal-300">{idea.recipeName}</h3>
            <p className="text-gray-400 mt-2 mb-4">{idea.description}</p>
            <button
              onClick={() => handleSelectRecipe(idea.recipeName)}
              disabled={isLoading && selectedRecipeName === idea.recipeName}
              className="w-full md:w-auto px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:bg-gray-500 flex items-center justify-center transition"
            >
              {isLoading && selectedRecipeName === idea.recipeName ? (
                <LoadingSpinner />
              ) : (
                "Mostra la Ricetta"
              )}
            </button>
          </div>
        ))}
      </div>
       {error && <p className="text-red-400 text-center mt-6">{error}</p>}
    </div>
  );

  const renderFullRecipe = () => (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button onClick={handleBackToIdeas} className="text-teal-400 hover:text-teal-300">&larr; Torna alle idee</button>
        <button
          onClick={handleCopy}
          className="flex items-center px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
        >
          {isCopied ? <CheckIcon /> : <CopyIcon />}
          <span className="ml-2">{isCopied ? "Copiato!" : "Copia"}</span>
        </button>
      </div>
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
        {fullRecipe ? <MarkdownRenderer content={fullRecipe} /> : <p>Caricamento ricetta...</p>}
      </div>
      <div className="text-center mt-8">
        <button onClick={resetState} className="px-6 py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition">
          Crea una nuova ricetta
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans p-4 md:p-8 flex items-center justify-center">
      <main className="w-full transition-all duration-500">
        {!recipeIdeas && !fullRecipe && renderInitialForm()}
        {recipeIdeas && !fullRecipe && renderRecipeIdeas()}
        {fullRecipe && renderFullRecipe()}
      </main>
    </div>
  );
};

export default App;
