const axios = require('axios');
const config = require('config');

// Perform Address Suggestion
module.exports.autoSuggest = async function (
  searchQuery,
  gpsLat = 53.55139,
  gpsLong = -113.62737,
  locale = 'en-US'
) {
  const urlAutoSuggest = 'https://discover.search.hereapi.com/v1/autosuggest';

  return await axios
    .get(urlAutoSuggest, {
      params: {
        q: searchQuery,
        at: gpsLat + ',' + gpsLong,
        lang: locale,
        apiKey: config.hereApi.apiKey,
        resultType: 'houseNumber',
        limit: config.hereApi.totalSuggestions,
      },
    })
    .then((response) => {
      var suggestions = response.data.items;
      return suggestions;
    })
    .catch(function (err) {
      console.log(err);
      return null;
    });
};
