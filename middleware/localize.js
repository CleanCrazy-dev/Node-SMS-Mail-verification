module.exports.Localization = function (req, res, next){
    const locale = req.header('Locale');
    if(locale) {
        i18n.setLocale(locale);
    }

    next();
}