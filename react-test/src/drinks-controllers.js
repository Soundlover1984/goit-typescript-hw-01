const { HttpError, controllerWrapper } = require("../helpers");
const {
  Drink,
  schemas,
} = require("../models/drink");
const { Ingredient } = require("../models/ingredient");


const formDrink = Object.keys({
    drink: 1,
    category: 1,
    alcoholic: 1,
    glass: 1,
    description: 1,
    shortDescription: 1,
    instructions: 1,
    drinkThumb: 1,
    ingredients: 1,
    favorite: 1,
    owner: 1,
    favoritesLength: 1,
  }).join(" ");

const getDrinkById = async (req, res) => {
  const { id: recipeId } = req.params;
  const result = await Drink.findById(recipeId, formDrink).populate(
    "ingredients.ingredientId",
    "ingredientThumb"
  );
  if (!result) throw HttpError(404, "Not Found");
  res.json(result);
};

const getMainPageDrinks = async (req, res) => {
  const condition = !req.user.isAdult
    ? "Non alcoholic"
    : /^(?:Alcoholic\b|Non alcoholic\b)/;

  const { count } = req.query;
  const result = await Drink.aggregate()
    .match({ alcoholic: condition })
    .addFields({
      favoritesLength: {
        $size: {
          $ifNull: ["$favorite", []],
        },
      },
    })
    .sort({
      category: 1,
      drink: 1,
    })
    .group({
      _id: "$category",
      category: { $first: "$category" },
      favoritesLength: { $first: "$favoritesLength" },
      docs: { $push: "$$ROOT" },
    })
    .project({
      _id: 0,
      category: 1,
      favoritesLength: 1,
      docs: {
        $slice: ["$docs", +count],
      },
    })
    .unwind("$docs")
    .replaceRoot("$docs")
    .project({
        drink: 1,
        category: 1,
        alcoholic: 1,
        glass: 1,
        description: 1,
        shortDescription: 1,
        instructions: 1,
        drinkThumb: 1,
        ingredients: 1,
        favorite: 1,
        owner: 1,
        favoritesLength: 1,
      })
    .exec();

  if (!result) throw HttpError(404, "Not Found");
  res.json(result);
};


const getPopularDrinks = async (req, res) => {
  const condition = !req.user.isAdult
    ? "Non alcoholic"
    : /^(?:Alcoholic\b|Non alcoholic\b)/;

  const result = await Recipe.aggregate()
    .match({ alcoholic: condition, favorite: { $exists: true } })
    .addFields({
      favoritesLength: {
        $size: "$favorite",
      },
    })
    .project({
        drink: 1,
        category: 1,
        alcoholic: 1,
        glass: 1,
        description: 1,
        shortDescription: 1,
        instructions: 1,
        drinkThumb: 1,
        ingredients: 1,
        favorite: 1,
        owner: 1,
        favoritesLength: 1,
      })
    .sort({
      favoritesLength: -1,
      drink: 1,
    })
    .exec();

  if (!result) throw HttpError(404, "Not Found");
  res.json(result);
};




module.exports = {
  getDrinkById: controllerWrapper(getDrinkById),
  getPopularDrinks: controllerWrapper(getPopularDrinks),
  getMainPageDrinks: controllerWrapper(getMainPageDrinks),
};