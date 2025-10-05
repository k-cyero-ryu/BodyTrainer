export interface CommonFood {
  fdcId: number;
  name: string;
  translations: {
    es: string;
    fr: string;
    pt: string;
  };
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  category: string;
}

export const commonFoods: CommonFood[] = [
  {
    fdcId: 171688,
    name: "Chicken breast",
    translations: {
      es: "Pechuga de pollo",
      fr: "Poitrine de poulet",
      pt: "Peito de frango"
    },
    nutrition: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    category: "Protein"
  },
  {
    fdcId: 174608,
    name: "Egg",
    translations: {
      es: "Huevo",
      fr: "Œuf",
      pt: "Ovo"
    },
    nutrition: { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
    category: "Protein"
  },
  {
    fdcId: 175168,
    name: "Ground beef",
    translations: {
      es: "Carne molida",
      fr: "Bœuf haché",
      pt: "Carne moída"
    },
    nutrition: { calories: 250, protein: 26, carbs: 0, fat: 15 },
    category: "Protein"
  },
  {
    fdcId: 173705,
    name: "Salmon",
    translations: {
      es: "Salmón",
      fr: "Saumon",
      pt: "Salmão"
    },
    nutrition: { calories: 208, protein: 20, carbs: 0, fat: 13 },
    category: "Protein"
  },
  {
    fdcId: 175303,
    name: "Turkey breast",
    translations: {
      es: "Pechuga de pavo",
      fr: "Poitrine de dinde",
      pt: "Peito de peru"
    },
    nutrition: { calories: 135, protein: 30, carbs: 0, fat: 0.7 },
    category: "Protein"
  },
  {
    fdcId: 173691,
    name: "Tuna",
    translations: {
      es: "Atún",
      fr: "Thon",
      pt: "Atum"
    },
    nutrition: { calories: 144, protein: 23, carbs: 0, fat: 5 },
    category: "Protein"
  },
  {
    fdcId: 167762,
    name: "Pork chop",
    translations: {
      es: "Chuleta de cerdo",
      fr: "Côtelette de porc",
      pt: "Costeleta de porco"
    },
    nutrition: { calories: 231, protein: 25, carbs: 0, fat: 14 },
    category: "Protein"
  },
  {
    fdcId: 171287,
    name: "White rice",
    translations: {
      es: "Arroz blanco",
      fr: "Riz blanc",
      pt: "Arroz branco"
    },
    nutrition: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
    category: "Grains"
  },
  {
    fdcId: 168878,
    name: "Brown rice",
    translations: {
      es: "Arroz integral",
      fr: "Riz brun",
      pt: "Arroz integral"
    },
    nutrition: { calories: 112, protein: 2.6, carbs: 24, fat: 0.9 },
    category: "Grains"
  },
  {
    fdcId: 169756,
    name: "Oatmeal",
    translations: {
      es: "Avena",
      fr: "Flocons d'avoine",
      pt: "Aveia"
    },
    nutrition: { calories: 68, protein: 2.4, carbs: 12, fat: 1.4 },
    category: "Grains"
  },
  {
    fdcId: 168917,
    name: "Whole wheat bread",
    translations: {
      es: "Pan integral",
      fr: "Pain complet",
      pt: "Pão integral"
    },
    nutrition: { calories: 247, protein: 13, carbs: 41, fat: 3.4 },
    category: "Grains"
  },
  {
    fdcId: 169736,
    name: "Pasta",
    translations: {
      es: "Pasta",
      fr: "Pâtes",
      pt: "Massa"
    },
    nutrition: { calories: 131, protein: 5, carbs: 25, fat: 1.1 },
    category: "Grains"
  },
  {
    fdcId: 169414,
    name: "Quinoa",
    translations: {
      es: "Quinoa",
      fr: "Quinoa",
      pt: "Quinoa"
    },
    nutrition: { calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },
    category: "Grains"
  },
  {
    fdcId: 171256,
    name: "Sweet potato",
    translations: {
      es: "Batata",
      fr: "Patate douce",
      pt: "Batata doce"
    },
    nutrition: { calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
    category: "Vegetables"
  },
  {
    fdcId: 170026,
    name: "Broccoli",
    translations: {
      es: "Brócoli",
      fr: "Brocoli",
      pt: "Brócolis"
    },
    nutrition: { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
    category: "Vegetables"
  },
  {
    fdcId: 170417,
    name: "Spinach",
    translations: {
      es: "Espinaca",
      fr: "Épinards",
      pt: "Espinafre"
    },
    nutrition: { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
    category: "Vegetables"
  },
  {
    fdcId: 170108,
    name: "Carrot",
    translations: {
      es: "Zanahoria",
      fr: "Carotte",
      pt: "Cenoura"
    },
    nutrition: { calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
    category: "Vegetables"
  },
  {
    fdcId: 169967,
    name: "Tomato",
    translations: {
      es: "Tomate",
      fr: "Tomate",
      pt: "Tomate"
    },
    nutrition: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
    category: "Vegetables"
  },
  {
    fdcId: 169249,
    name: "Bell pepper",
    translations: {
      es: "Pimiento",
      fr: "Poivron",
      pt: "Pimentão"
    },
    nutrition: { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
    category: "Vegetables"
  },
  {
    fdcId: 169225,
    name: "Cucumber",
    translations: {
      es: "Pepino",
      fr: "Concombre",
      pt: "Pepino"
    },
    nutrition: { calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
    category: "Vegetables"
  },
  {
    fdcId: 168462,
    name: "Lettuce",
    translations: {
      es: "Lechuga",
      fr: "Laitue",
      pt: "Alface"
    },
    nutrition: { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
    category: "Vegetables"
  },
  {
    fdcId: 170419,
    name: "Asparagus",
    translations: {
      es: "Espárrago",
      fr: "Asperge",
      pt: "Aspargo"
    },
    nutrition: { calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1 },
    category: "Vegetables"
  },
  {
    fdcId: 169986,
    name: "Zucchini",
    translations: {
      es: "Calabacín",
      fr: "Courgette",
      pt: "Abobrinha"
    },
    nutrition: { calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
    category: "Vegetables"
  },
  {
    fdcId: 171706,
    name: "Apple",
    translations: {
      es: "Manzana",
      fr: "Pomme",
      pt: "Maçã"
    },
    nutrition: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
    category: "Fruits"
  },
  {
    fdcId: 173944,
    name: "Banana",
    translations: {
      es: "Plátano",
      fr: "Banane",
      pt: "Banana"
    },
    nutrition: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
    category: "Fruits"
  },
  {
    fdcId: 169097,
    name: "Orange",
    translations: {
      es: "Naranja",
      fr: "Orange",
      pt: "Laranja"
    },
    nutrition: { calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
    category: "Fruits"
  },
  {
    fdcId: 167765,
    name: "Strawberry",
    translations: {
      es: "Fresa",
      fr: "Fraise",
      pt: "Morango"
    },
    nutrition: { calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
    category: "Fruits"
  },
  {
    fdcId: 173946,
    name: "Blueberry",
    translations: {
      es: "Arándano",
      fr: "Myrtille",
      pt: "Mirtilo"
    },
    nutrition: { calories: 57, protein: 0.7, carbs: 14, fat: 0.3 },
    category: "Fruits"
  },
  {
    fdcId: 171721,
    name: "Grapes",
    translations: {
      es: "Uvas",
      fr: "Raisins",
      pt: "Uvas"
    },
    nutrition: { calories: 69, protein: 0.7, carbs: 18, fat: 0.2 },
    category: "Fruits"
  },
  {
    fdcId: 169910,
    name: "Watermelon",
    translations: {
      es: "Sandía",
      fr: "Pastèque",
      pt: "Melancia"
    },
    nutrition: { calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2 },
    category: "Fruits"
  },
  {
    fdcId: 171719,
    name: "Pineapple",
    translations: {
      es: "Piña",
      fr: "Ananas",
      pt: "Abacaxi"
    },
    nutrition: { calories: 50, protein: 0.5, carbs: 13, fat: 0.1 },
    category: "Fruits"
  },
  {
    fdcId: 171734,
    name: "Mango",
    translations: {
      es: "Mango",
      fr: "Mangue",
      pt: "Manga"
    },
    nutrition: { calories: 60, protein: 0.8, carbs: 15, fat: 0.4 },
    category: "Fruits"
  },
  {
    fdcId: 171688,
    name: "Avocado",
    translations: {
      es: "Aguacate",
      fr: "Avocat",
      pt: "Abacate"
    },
    nutrition: { calories: 160, protein: 2, carbs: 8.5, fat: 15 },
    category: "Fruits"
  },
  {
    fdcId: 171284,
    name: "Milk",
    translations: {
      es: "Leche",
      fr: "Lait",
      pt: "Leite"
    },
    nutrition: { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
    category: "Dairy"
  },
  {
    fdcId: 170851,
    name: "Greek yogurt",
    translations: {
      es: "Yogur griego",
      fr: "Yaourt grec",
      pt: "Iogurte grego"
    },
    nutrition: { calories: 97, protein: 9, carbs: 3.9, fat: 5 },
    category: "Dairy"
  },
  {
    fdcId: 173410,
    name: "Cheddar cheese",
    translations: {
      es: "Queso cheddar",
      fr: "Fromage cheddar",
      pt: "Queijo cheddar"
    },
    nutrition: { calories: 403, protein: 23, carbs: 3.1, fat: 33 },
    category: "Dairy"
  },
  {
    fdcId: 173418,
    name: "Mozzarella cheese",
    translations: {
      es: "Queso mozzarella",
      fr: "Fromage mozzarella",
      pt: "Queijo mozzarella"
    },
    nutrition: { calories: 280, protein: 28, carbs: 3.1, fat: 17 },
    category: "Dairy"
  },
  {
    fdcId: 173441,
    name: "Cottage cheese",
    translations: {
      es: "Requesón",
      fr: "Fromage cottage",
      pt: "Queijo cottage"
    },
    nutrition: { calories: 98, protein: 11, carbs: 3.4, fat: 4.3 },
    category: "Dairy"
  },
  {
    fdcId: 175196,
    name: "Black beans",
    translations: {
      es: "Frijoles negros",
      fr: "Haricots noirs",
      pt: "Feijão preto"
    },
    nutrition: { calories: 132, protein: 8.9, carbs: 24, fat: 0.5 },
    category: "Legumes"
  },
  {
    fdcId: 172421,
    name: "Chickpeas",
    translations: {
      es: "Garbanzos",
      fr: "Pois chiches",
      pt: "Grão de bico"
    },
    nutrition: { calories: 164, protein: 8.9, carbs: 27, fat: 2.6 },
    category: "Legumes"
  },
  {
    fdcId: 172420,
    name: "Lentils",
    translations: {
      es: "Lentejas",
      fr: "Lentilles",
      pt: "Lentilhas"
    },
    nutrition: { calories: 116, protein: 9, carbs: 20, fat: 0.4 },
    category: "Legumes"
  },
  {
    fdcId: 175203,
    name: "Kidney beans",
    translations: {
      es: "Frijoles rojos",
      fr: "Haricots rouges",
      pt: "Feijão vermelho"
    },
    nutrition: { calories: 127, protein: 8.7, carbs: 23, fat: 0.5 },
    category: "Legumes"
  },
  {
    fdcId: 170567,
    name: "Almonds",
    translations: {
      es: "Almendras",
      fr: "Amandes",
      pt: "Amêndoas"
    },
    nutrition: { calories: 579, protein: 21, carbs: 22, fat: 50 },
    category: "Nuts"
  },
  {
    fdcId: 170178,
    name: "Peanuts",
    translations: {
      es: "Cacahuetes",
      fr: "Cacahuètes",
      pt: "Amendoim"
    },
    nutrition: { calories: 567, protein: 26, carbs: 16, fat: 49 },
    category: "Nuts"
  },
  {
    fdcId: 170185,
    name: "Walnuts",
    translations: {
      es: "Nueces",
      fr: "Noix",
      pt: "Nozes"
    },
    nutrition: { calories: 654, protein: 15, carbs: 14, fat: 65 },
    category: "Nuts"
  },
  {
    fdcId: 170562,
    name: "Cashews",
    translations: {
      es: "Anacardos",
      fr: "Noix de cajou",
      pt: "Castanha de caju"
    },
    nutrition: { calories: 553, protein: 18, carbs: 30, fat: 44 },
    category: "Nuts"
  },
  {
    fdcId: 170555,
    name: "Peanut butter",
    translations: {
      es: "Mantequilla de cacahuete",
      fr: "Beurre de cacahuète",
      pt: "Manteiga de amendoim"
    },
    nutrition: { calories: 588, protein: 25, carbs: 20, fat: 50 },
    category: "Nuts"
  },
  {
    fdcId: 171028,
    name: "Olive oil",
    translations: {
      es: "Aceite de oliva",
      fr: "Huile d'olive",
      pt: "Azeite de oliva"
    },
    nutrition: { calories: 884, protein: 0, carbs: 0, fat: 100 },
    category: "Oils"
  },
  {
    fdcId: 173410,
    name: "Butter",
    translations: {
      es: "Mantequilla",
      fr: "Beurre",
      pt: "Manteiga"
    },
    nutrition: { calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },
    category: "Oils"
  },
  {
    fdcId: 172336,
    name: "Coconut oil",
    translations: {
      es: "Aceite de coco",
      fr: "Huile de coco",
      pt: "Óleo de coco"
    },
    nutrition: { calories: 862, protein: 0, carbs: 0, fat: 100 },
    category: "Oils"
  }
];

export function searchCommonFoods(query: string, language: 'en' | 'es' | 'fr' | 'pt' = 'en'): CommonFood[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  return commonFoods.filter(food => {
    const englishMatch = food.name.toLowerCase().includes(normalizedQuery);
    const translatedMatch = language !== 'en' && 
      food.translations[language].toLowerCase().includes(normalizedQuery);
    
    return englishMatch || translatedMatch;
  });
}

export function getCommonFoodByFdcId(fdcId: number): CommonFood | undefined {
  return commonFoods.find(food => food.fdcId === fdcId);
}

export function getTranslatedFoodName(food: CommonFood, language: 'en' | 'es' | 'fr' | 'pt'): string {
  if (language === 'en') {
    return food.name;
  }
  return food.translations[language];
}
