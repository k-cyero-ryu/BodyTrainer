import { commonFoods } from '@/data/commonFoods';

/**
 * Translates a food name from English to the target language
 * @param foodDescription - The food description from database (e.g., "Ground beef (100g)" or "Fish, salmon, Atlantic, farmed, cooked, dry heat")
 * @param language - The target language code ('en', 'es', 'fr', 'pt')
 * @returns The translated food description or original if no translation found
 */
export function translateFoodName(foodDescription: string, language: string): string {
  if (!foodDescription || language === 'en') {
    return foodDescription;
  }

  const quantityMatch = foodDescription.match(/\(([^)]+)\)$/);
  const quantity = quantityMatch ? quantityMatch[0] : '';
  
  const baseName = foodDescription.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const lowerBaseName = baseName.toLowerCase();

  let matchedFood = commonFoods.find(f => 
    f.name.toLowerCase() === lowerBaseName
  );

  if (!matchedFood) {
    const partialMatches = commonFoods
      .filter(f => {
        const foodName = f.name.toLowerCase();
        return lowerBaseName.includes(foodName) || foodName.includes(lowerBaseName);
      })
      .sort((a, b) => b.name.length - a.name.length);
    
    matchedFood = partialMatches[0];
  }

  if (matchedFood && matchedFood.translations[language as 'es' | 'fr' | 'pt']) {
    const translatedName = matchedFood.translations[language as 'es' | 'fr' | 'pt'];
    return quantity ? `${translatedName} ${quantity}` : translatedName;
  }

  return foodDescription;
}
