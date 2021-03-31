class language {
  constructor(numberOfPayments) {
    this._numberOfPayments = numberOfPayments;
    this._defaultLanguage = 'en';
    this._translations = {
      en: `or ${this._numberOfPayments} interest-free payments of %%price%% with %%logo%% %%info%%`,
      fr: `ou ${this._numberOfPayments} paiements de %%price%% sans intérêts avec %%logo%% %%info%%`,
      de: `oder ${this._numberOfPayments} zinslose Zahlungen von je %%price%% mit %%logo%% %%info%%`,
      es: `o ${this._numberOfPayments} pagos sin intereses de %%price%% con %%logo%% %%info%%`,
      'en-GB': `or ${this._numberOfPayments} payments of %%price%% with %%logo%% %%info%% - no fee`,
      'fr-FR': `ou ${this._numberOfPayments} paiements de %%price%% avec %%logo%% %%info%% – pas de frais`,
      'de-DE': `oder ${this._numberOfPayments} mal %%price%% mit %%logo%% %%info%% - kostenlos`,
    };
    this._language = null;
    this._browserLanguage = null;
  }

  _setBrowserLanguage() {
    this._browserLanguage = navigator.language || navigator.browserLanguage || this._defaultLanguage;
  }

  getTranslation() {
    if (this._checkIfLanguageIsValid(this._language)) {
      return this._translations[this._language];
    }
    return this._translations[this._defaultLanguage];
  }

  setLanguage(lang) {
    const typeOfLanguageOption = typeof (lang);
    if (!this._checkIfLanguageIsValid(lang)) {
      this._language = this._browserLanguage;
    } else {
      switch (typeOfLanguageOption) {
      case 'string':
        this._language = lang;
        break;
      case 'function':
        this._language = lang();
        break;
      default:
        this._language = this._browserLanguage;
        break;
      }
    }
    const northAmerica = ['US', 'CA', 'MX', 'IN', 'GU', 'PR', 'AS', 'MP', 'VI', '', null, undefined];
    const langCode = lang.substring(0, 2).toLowerCase();
    const locale = lang.split('-')[1];
    if (northAmerica.indexOf(this._countryCode) > -1) {
      // eslint-disable-next-line no-unused-expressions
      this._checkIfLanguageIsValid(langCode) ? this._language = langCode : this._language = 'en';
    } else if (this._checkIfLanguageIsValid(langCode)) {
      this._language = `${langCode}-${locale}`;
    } else {
      // eslint-disable-next-line no-unused-expressions
      this._checkIfLanguageIsValid(`${langCode}-${langCode.toUpperCase()}`) ? this._language = `${langCode}-${langCode.toUpperCase()}` : this._language = 'en-GB';
    }
    document.sezzleLanguage = this._language;
  }

  _checkIfLanguageIsValid(lang) {
    let validityCounter = 0;
    const availableLanguages = Object.getOwnPropertyNames(this._translations);
    availableLanguages.forEach((l) => {
      if (l === lang) {
        validityCounter++;
      }
    });
    return validityCounter > 0;
  }

  constructWidgetTemplate(widgetTemplate) {
    if (typeof (widgetTemplate) === 'object' && widgetTemplate != null) {
      if (!widgetTemplate.en && !widgetTemplate[this._language]) {
        console.warn("Please specify atleast 'en' key in altVersionTemplate, rendering default widget template.");
        return this.getTranslation(this._numberOfPayments);
      }
      return widgetTemplate[this._language] || widgetTemplate.en;
    }
    return widgetTemplate;
  }

  init() {
    this._setBrowserLanguage();
  }

  getLanguage() {
    return this._language;
  }

  getBrowserLanguage() {
    return this._browserLanguage;
  }
}

export default language;
