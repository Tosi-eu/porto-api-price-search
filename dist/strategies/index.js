"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultStrategies = createDefaultStrategies;
const buscape_strategy_1 = require("./buscape.strategy");
const consulta_remedios_strategy_1 = require("./consulta-remedios.strategy");
const droga_raia_strategy_1 = require("./droga-raia.strategy");
const drogaria_sao_paulo_strategy_1 = require("./drogaria-sao-paulo.strategy");
const mercado_livre_strategy_1 = require("./mercado-livre.strategy");
function createDefaultStrategies() {
    return [
        new consulta_remedios_strategy_1.ConsultaRemediosStrategy(),
        new droga_raia_strategy_1.DrogaRaiaStrategy(),
        new drogaria_sao_paulo_strategy_1.DrogariaSaoPauloStrategy(),
        new mercado_livre_strategy_1.MercadoLivreStrategy(),
        new buscape_strategy_1.BuscapeStrategy(),
    ];
}
//# sourceMappingURL=index.js.map