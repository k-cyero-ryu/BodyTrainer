# Food Database Guide

## How to Add New Food Items to the Local Food Database

This guide explains how to add new food items to any category in the My Body Trainer Manager application.

### Overview

The local food database stores common foods with:
- Nutritional information (calories, protein, carbs, fat)
- Multi-language translations (English, Spanish, French, Portuguese)
- Category organization

### Files to Modify

**Main File:** `client/src/data/commonFoods.ts`

This file contains all food items in the `commonFoods` array.

---

## Step-by-Step Instructions

### Step 1: Open the Food Database File

Navigate to `client/src/data/commonFoods.ts`

### Step 2: Choose a Unique Food ID

Each food item needs a unique `fdcId` number. 

**Guidelines:**
- Existing food IDs range from ~167000 to ~175000
- For custom foods, use IDs starting from 999001, 999002, etc.
- Make sure the ID doesn't conflict with existing ones

### Step 3: Gather Nutritional Information

You'll need the following nutrition data **per 100g**:
- **calories**: Total calories (kcal)
- **protein**: Protein content (g)
- **carbs**: Carbohydrate content (g)
- **fat**: Fat content (g)

**Example Sources:**
- USDA FoodData Central (https://fdc.nal.usda.gov/)
- Product nutrition labels
- Reliable nutrition databases

### Step 4: Prepare Translations

Translate the food name into all supported languages:
- **es**: Spanish
- **fr**: French
- **pt**: Portuguese

**Translation Tips:**
- Use Google Translate as a starting point
- Verify with native speakers if possible
- Use common culinary terms

### Step 5: Add the Food Item

Add your food item to the `commonFoods` array before the closing bracket `];`

**Template:**
```typescript
{
  fdcId: YOUR_UNIQUE_ID,
  name: "Food name in English",
  translations: {
    es: "Nombre en español",
    fr: "Nom en français",
    pt: "Nome em português"
  },
  nutrition: { 
    calories: NUMBER, 
    protein: NUMBER, 
    carbs: NUMBER, 
    fat: NUMBER 
  },
  category: "CategoryName"
}
```

### Step 6: Choose or Create a Category

**Existing Categories:**
- Protein
- Grains / Grain
- Vegetables / Vegetable
- Fruits / Fruit
- Dairy
- Legumes
- Nuts
- Oils
- Sweetener
- Condiment
- Supplements

**Note:** You can create new categories by simply using a new category name.

---

## Complete Example

Here's how we added "Protein powder" to the Supplements category:

```typescript
{
  fdcId: 999001,
  name: "Protein powder",
  translations: {
    es: "Proteína en polvo",
    fr: "Protéine en poudre",
    pt: "Proteína em pó"
  },
  nutrition: { calories: 120, protein: 24, carbs: 3, fat: 1.5 },
  category: "Supplements"
}
```

### Breakdown:

1. **fdcId: 999001** - Custom ID starting from 999001
2. **name: "Protein powder"** - English name
3. **translations** - Translated to Spanish, French, and Portuguese
4. **nutrition** - Per 100g values (or per serving for supplements)
5. **category: "Supplements"** - New category created

---

## Full Example: Adding Multiple Items

```typescript
// At the end of the commonFoods array, before the ];
  {
    fdcId: 999001,
    name: "Protein powder",
    translations: {
      es: "Proteína en polvo",
      fr: "Protéine en poudre",
      pt: "Proteína em pó"
    },
    nutrition: { calories: 120, protein: 24, carbs: 3, fat: 1.5 },
    category: "Supplements"
  },
  {
    fdcId: 999002,
    name: "Protein shake",
    translations: {
      es: "Batido de proteína",
      fr: "Shake protéiné",
      pt: "Shake de proteína"
    },
    nutrition: { calories: 160, protein: 30, carbs: 5, fat: 3 },
    category: "Supplements"
  },
  {
    fdcId: 999003,
    name: "Creatine",
    translations: {
      es: "Creatina",
      fr: "Créatine",
      pt: "Creatina"
    },
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    category: "Supplements"
  }
];
```

**Important:** Make sure to add a comma after the previous item, but NOT after the last item in the array.

---

## How the System Works

Once you add food items to `commonFoods.ts`:

1. **Food Search** - The food selector will automatically find and display your new items when users search
2. **Translation** - When users change languages, the translations will automatically apply
3. **Nutrition Tracking** - The nutrition values will be used in calorie and macro calculations

---

## Testing Your Changes

After adding new food items:

1. The application will automatically restart
2. Go to the Nutrition page
3. Try searching for your new food items
4. Verify the items appear in search results
5. Test in different languages to verify translations

---

## Common Categories Reference

### Protein Sources
- Chicken, fish, beef, eggs, tofu, etc.

### Grains / Grain
- Rice, pasta, bread, quinoa, oats, etc.

### Vegetables / Vegetable
- Broccoli, spinach, carrots, peppers, etc.

### Fruits / Fruit
- Apples, bananas, berries, oranges, etc.

### Dairy
- Milk, cheese, yogurt, cottage cheese, etc.

### Legumes
- Beans, lentils, chickpeas, hummus, etc.

### Nuts
- Almonds, peanuts, walnuts, seeds, etc.

### Oils
- Olive oil, coconut oil, butter, etc.

### Supplements
- Protein powder, protein shakes, creatine, BCAAs, etc.

### Sweetener
- Honey, maple syrup, dark chocolate, etc.

### Condiment
- Soy sauce, ketchup, mustard, etc.

---

## Tips for Success

1. **Be Consistent** - Use standard serving sizes (typically 100g for solid foods)
2. **Verify Nutrition Data** - Use reliable sources for accurate tracking
3. **Keep Translations Simple** - Use common food names that users will recognize
4. **Test Thoroughly** - Always test new items in the app after adding them
5. **Use Unique IDs** - Start custom IDs from 999001 to avoid conflicts

---

## Need Help?

If you encounter issues:
- Check for syntax errors (missing commas, brackets)
- Verify all fields are filled in correctly
- Ensure the fdcId is unique
- Check that nutrition values are numbers (not strings)
