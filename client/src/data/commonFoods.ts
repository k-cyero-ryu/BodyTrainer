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
    fdcId: 171705,
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
  },
  {
    fdcId: 171709,
    name: "Shrimp",
    translations: {
      es: "Camarones",
      fr: "Crevettes",
      pt: "Camarão"
    },
    nutrition: { calories: 99, protein: 24, carbs: 0.2, fat: 0.3 },
    category: "Protein"
  },
  {
    fdcId: 171959,
    name: "Tuna",
    translations: {
      es: "Atún",
      fr: "Thon",
      pt: "Atum"
    },
    nutrition: { calories: 130, protein: 28, carbs: 0, fat: 0.95 },
    category: "Protein"
  },
  {
    fdcId: 175168,
    name: "Lamb",
    translations: {
      es: "Cordero",
      fr: "Agneau",
      pt: "Cordeiro"
    },
    nutrition: { calories: 294, protein: 25, carbs: 0, fat: 21 },
    category: "Protein"
  },
  {
    fdcId: 171722,
    name: "Duck",
    translations: {
      es: "Pato",
      fr: "Canard",
      pt: "Pato"
    },
    nutrition: { calories: 337, protein: 19, carbs: 0, fat: 28 },
    category: "Protein"
  },
  {
    fdcId: 171715,
    name: "Crab",
    translations: {
      es: "Cangrejo",
      fr: "Crabe",
      pt: "Caranguejo"
    },
    nutrition: { calories: 97, protein: 19, carbs: 0, fat: 1.5 },
    category: "Protein"
  },
  {
    fdcId: 171716,
    name: "Lobster",
    translations: {
      es: "Langosta",
      fr: "Homard",
      pt: "Lagosta"
    },
    nutrition: { calories: 89, protein: 19, carbs: 0, fat: 0.9 },
    category: "Protein"
  },
  {
    fdcId: 175139,
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
    fdcId: 173686,
    name: "Sardines",
    translations: {
      es: "Sardinas",
      fr: "Sardines",
      pt: "Sardinhas"
    },
    nutrition: { calories: 208, protein: 25, carbs: 0, fat: 11 },
    category: "Protein"
  },
  {
    fdcId: 175116,
    name: "Bacon",
    translations: {
      es: "Tocino",
      fr: "Bacon",
      pt: "Bacon"
    },
    nutrition: { calories: 541, protein: 37, carbs: 1.4, fat: 42 },
    category: "Protein"
  },
  {
    fdcId: 173687,
    name: "Mackerel",
    translations: {
      es: "Caballa",
      fr: "Maquereau",
      pt: "Cavala"
    },
    nutrition: { calories: 205, protein: 19, carbs: 0, fat: 14 },
    category: "Protein"
  },
  {
    fdcId: 173692,
    name: "Cod",
    translations: {
      es: "Bacalao",
      fr: "Morue",
      pt: "Bacalhau"
    },
    nutrition: { calories: 82, protein: 18, carbs: 0, fat: 0.7 },
    category: "Protein"
  },
  {
    fdcId: 170394,
    name: "Zucchini",
    translations: {
      es: "Calabacín",
      fr: "Courgette",
      pt: "Abobrinha"
    },
    nutrition: { calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
    category: "Vegetable"
  },
  {
    fdcId: 169228,
    name: "Eggplant",
    translations: {
      es: "Berenjena",
      fr: "Aubergine",
      pt: "Berinjela"
    },
    nutrition: { calories: 25, protein: 1, carbs: 6, fat: 0.2 },
    category: "Vegetable"
  },
  {
    fdcId: 170108,
    name: "Bell pepper",
    translations: {
      es: "Pimiento",
      fr: "Poivron",
      pt: "Pimentão"
    },
    nutrition: { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
    category: "Vegetable"
  },
  {
    fdcId: 169988,
    name: "Celery",
    translations: {
      es: "Apio",
      fr: "Céleri",
      pt: "Aipo"
    },
    nutrition: { calories: 16, protein: 0.7, carbs: 3, fat: 0.2 },
    category: "Vegetable"
  },
  {
    fdcId: 168409,
    name: "Cucumber",
    translations: {
      es: "Pepino",
      fr: "Concombre",
      pt: "Pepino"
    },
    nutrition: { calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
    category: "Vegetable"
  },
  {
    fdcId: 169251,
    name: "Mushrooms",
    translations: {
      es: "Champiñones",
      fr: "Champignons",
      pt: "Cogumelos"
    },
    nutrition: { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
    category: "Vegetable"
  },
  {
    fdcId: 170390,
    name: "Cauliflower",
    translations: {
      es: "Coliflor",
      fr: "Chou-fleur",
      pt: "Couve-flor"
    },
    nutrition: { calories: 25, protein: 1.9, carbs: 5, fat: 0.3 },
    category: "Vegetable"
  },
  {
    fdcId: 169967,
    name: "Cabbage",
    translations: {
      es: "Repollo",
      fr: "Chou",
      pt: "Repolho"
    },
    nutrition: { calories: 25, protein: 1.3, carbs: 5.8, fat: 0.1 },
    category: "Vegetable"
  },
  {
    fdcId: 170379,
    name: "Asparagus",
    translations: {
      es: "Espárragos",
      fr: "Asperges",
      pt: "Aspargos"
    },
    nutrition: { calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1 },
    category: "Vegetable"
  },
  {
    fdcId: 170417,
    name: "Green beans",
    translations: {
      es: "Judías verdes",
      fr: "Haricots verts",
      pt: "Vagem"
    },
    nutrition: { calories: 31, protein: 1.8, carbs: 7, fat: 0.2 },
    category: "Vegetable"
  },
  {
    fdcId: 171688,
    name: "Grapes",
    translations: {
      es: "Uvas",
      fr: "Raisins",
      pt: "Uvas"
    },
    nutrition: { calories: 69, protein: 0.7, carbs: 18, fat: 0.2 },
    category: "Fruit"
  },
  {
    fdcId: 169124,
    name: "Pineapple",
    translations: {
      es: "Piña",
      fr: "Ananas",
      pt: "Abacaxi"
    },
    nutrition: { calories: 50, protein: 0.5, carbs: 13, fat: 0.1 },
    category: "Fruit"
  },
  {
    fdcId: 167765,
    name: "Watermelon",
    translations: {
      es: "Sandía",
      fr: "Pastèque",
      pt: "Melancia"
    },
    nutrition: { calories: 30, protein: 0.6, carbs: 8, fat: 0.2 },
    category: "Fruit"
  },
  {
    fdcId: 169092,
    name: "Cantaloupe",
    translations: {
      es: "Melón",
      fr: "Melon cantaloup",
      pt: "Melão"
    },
    nutrition: { calories: 34, protein: 0.8, carbs: 8, fat: 0.2 },
    category: "Fruit"
  },
  {
    fdcId: 168153,
    name: "Kiwi",
    translations: {
      es: "Kiwi",
      fr: "Kiwi",
      pt: "Kiwi"
    },
    nutrition: { calories: 61, protein: 1.1, carbs: 15, fat: 0.5 },
    category: "Fruit"
  },
  {
    fdcId: 169910,
    name: "Mango",
    translations: {
      es: "Mango",
      fr: "Mangue",
      pt: "Manga"
    },
    nutrition: { calories: 60, protein: 0.8, carbs: 15, fat: 0.4 },
    category: "Fruit"
  },
  {
    fdcId: 169926,
    name: "Papaya",
    translations: {
      es: "Papaya",
      fr: "Papaye",
      pt: "Mamão"
    },
    nutrition: { calories: 43, protein: 0.5, carbs: 11, fat: 0.3 },
    category: "Fruit"
  },
  {
    fdcId: 169134,
    name: "Peach",
    translations: {
      es: "Durazno",
      fr: "Pêche",
      pt: "Pêssego"
    },
    nutrition: { calories: 39, protein: 0.9, carbs: 10, fat: 0.3 },
    category: "Fruit"
  },
  {
    fdcId: 168203,
    name: "Plum",
    translations: {
      es: "Ciruela",
      fr: "Prune",
      pt: "Ameixa"
    },
    nutrition: { calories: 46, protein: 0.7, carbs: 11, fat: 0.3 },
    category: "Fruit"
  },
  {
    fdcId: 169945,
    name: "Pear",
    translations: {
      es: "Pera",
      fr: "Poire",
      pt: "Pera"
    },
    nutrition: { calories: 57, protein: 0.4, carbs: 15, fat: 0.1 },
    category: "Fruit"
  },
  {
    fdcId: 168191,
    name: "Cherries",
    translations: {
      es: "Cerezas",
      fr: "Cerises",
      pt: "Cerejas"
    },
    nutrition: { calories: 63, protein: 1.1, carbs: 16, fat: 0.2 },
    category: "Fruit"
  },
  {
    fdcId: 168917,
    name: "Quinoa",
    translations: {
      es: "Quinoa",
      fr: "Quinoa",
      pt: "Quinoa"
    },
    nutrition: { calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },
    category: "Grain"
  },
  {
    fdcId: 170283,
    name: "Barley",
    translations: {
      es: "Cebada",
      fr: "Orge",
      pt: "Cevada"
    },
    nutrition: { calories: 123, protein: 2.3, carbs: 28, fat: 0.4 },
    category: "Grain"
  },
  {
    fdcId: 168876,
    name: "Couscous",
    translations: {
      es: "Cuscús",
      fr: "Couscous",
      pt: "Cuscuz"
    },
    nutrition: { calories: 112, protein: 3.8, carbs: 23, fat: 0.2 },
    category: "Grain"
  },
  {
    fdcId: 168878,
    name: "Buckwheat",
    translations: {
      es: "Trigo sarraceno",
      fr: "Sarrasin",
      pt: "Trigo sarraceno"
    },
    nutrition: { calories: 92, protein: 3.4, carbs: 20, fat: 0.6 },
    category: "Grain"
  },
  {
    fdcId: 173430,
    name: "Cream cheese",
    translations: {
      es: "Queso crema",
      fr: "Fromage à la crème",
      pt: "Cream cheese"
    },
    nutrition: { calories: 342, protein: 5.9, carbs: 5.5, fat: 34 },
    category: "Dairy"
  },
  {
    fdcId: 170851,
    name: "Sour cream",
    translations: {
      es: "Crema agria",
      fr: "Crème aigre",
      pt: "Creme azedo"
    },
    nutrition: { calories: 198, protein: 2.4, carbs: 4.6, fat: 19 },
    category: "Dairy"
  },
  {
    fdcId: 173417,
    name: "Heavy cream",
    translations: {
      es: "Nata para montar",
      fr: "Crème épaisse",
      pt: "Creme de leite"
    },
    nutrition: { calories: 340, protein: 2.1, carbs: 2.8, fat: 36 },
    category: "Dairy"
  },
  {
    fdcId: 170188,
    name: "Pistachios",
    translations: {
      es: "Pistachos",
      fr: "Pistaches",
      pt: "Pistaches"
    },
    nutrition: { calories: 560, protein: 20, carbs: 28, fat: 45 },
    category: "Nuts"
  },
  {
    fdcId: 170182,
    name: "Pecans",
    translations: {
      es: "Nueces pecanas",
      fr: "Noix de pécan",
      pt: "Nozes-pecã"
    },
    nutrition: { calories: 691, protein: 9.2, carbs: 14, fat: 72 },
    category: "Nuts"
  },
  {
    fdcId: 170581,
    name: "Hazelnuts",
    translations: {
      es: "Avellanas",
      fr: "Noisettes",
      pt: "Avelãs"
    },
    nutrition: { calories: 628, protein: 15, carbs: 17, fat: 61 },
    category: "Nuts"
  },
  {
    fdcId: 170591,
    name: "Sunflower seeds",
    translations: {
      es: "Semillas de girasol",
      fr: "Graines de tournesol",
      pt: "Sementes de girassol"
    },
    nutrition: { calories: 584, protein: 21, carbs: 20, fat: 51 },
    category: "Nuts"
  },
  {
    fdcId: 170554,
    name: "Chia seeds",
    translations: {
      es: "Semillas de chía",
      fr: "Graines de chia",
      pt: "Sementes de chia"
    },
    nutrition: { calories: 486, protein: 17, carbs: 42, fat: 31 },
    category: "Nuts"
  },
  {
    fdcId: 169640,
    name: "Honey",
    translations: {
      es: "Miel",
      fr: "Miel",
      pt: "Mel"
    },
    nutrition: { calories: 304, protein: 0.3, carbs: 82, fat: 0 },
    category: "Sweetener"
  },
  {
    fdcId: 168833,
    name: "Dark chocolate",
    translations: {
      es: "Chocolate negro",
      fr: "Chocolat noir",
      pt: "Chocolate amargo"
    },
    nutrition: { calories: 546, protein: 4.9, carbs: 61, fat: 31 },
    category: "Sweetener"
  },
  {
    fdcId: 170273,
    name: "Tofu",
    translations: {
      es: "Tofu",
      fr: "Tofu",
      pt: "Tofu"
    },
    nutrition: { calories: 76, protein: 8, carbs: 1.9, fat: 4.8 },
    category: "Protein"
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
