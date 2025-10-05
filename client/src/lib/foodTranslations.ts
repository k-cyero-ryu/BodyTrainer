import { commonFoods } from '@/data/commonFoods';

/**
 * Translates a food name from English to the target language
 * @param foodDescription - The food description from database (e.g., "Ground beef (100g)")
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

  const food = commonFoods.find(f => 
    f.name.toLowerCase() === baseName.toLowerCase()
  );

  if (food && food.translations[language as 'es' | 'fr' | 'pt']) {
    const translatedName = food.translations[language as 'es' | 'fr' | 'pt'];
    return quantity ? `${translatedName} ${quantity}` : translatedName;
  }

  return foodDescription;
}
