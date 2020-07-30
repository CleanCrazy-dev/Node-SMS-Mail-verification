const mongoose = require('mongoose');

const CountriesStatesCitiesSchema = new mongoose.Schema({
  id: { type: Number },
  name: { type: String, trim: true },
  iso3: { type: String, trim: true },
  iso2: { type: String, trim: true },
  phone_code: { type: String, trim: true },
  capital: { type: String, trim: true },
  currency: { type: String, trim: true },
  states: [
    {
      id: { type: Number },
      name: { type: String, trim: true },
      state_code: { type: String, trim: true },
      cities: [
        {
          id: { type: Number },
          name: { type: String, trim: true },
          latitude: { type: String, trim: true },
          longitude: { type: String, trim: true },
        },
      ],
    },
  ],
});

module.exports = CountriesStatesCities = mongoose.model(
  'CountriesStatesCities',
  CountriesStatesCitiesSchema
);
