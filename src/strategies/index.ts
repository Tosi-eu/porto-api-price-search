import { BuscapeStrategy } from './buscape.strategy';
import { ConsultaRemediosStrategy } from './consulta-remedios.strategy';
import { DrogaRaiaStrategy } from './droga-raia.strategy';
import { DrogariaSaoPauloStrategy } from './drogaria-sao-paulo.strategy';
import { MercadoLivreStrategy } from './mercado-livre.strategy';
import type { PriceSourceStrategy } from '../types';

export function createDefaultStrategies(): PriceSourceStrategy[] {
  return [
    new ConsultaRemediosStrategy(),
    new DrogaRaiaStrategy(),
    new DrogariaSaoPauloStrategy(),
    new MercadoLivreStrategy(),
    new BuscapeStrategy(),
  ];
}
