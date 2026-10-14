import { DFeError } from './DFeError';

export class SefazRejectError extends DFeError {
  constructor(
    public readonly cStat: string,
    public readonly xMotivo: string,
    public readonly uf?: string,
    /**
     * XML assinado que foi enviado (com infNFeSupl, sem protocolo).
     * Permite ao chamador guardar o XML mesmo na rejeição — essencial
     * p/ suporte comparar o que foi enviado com o que a SEFAZ esperava.
     */
    public readonly xmlEnviado?: string
  ) {
    super(`SEFAZ rejeitou o documento: [${cStat}] ${xMotivo}`);
    this.name = 'SefazRejectError';
  }
}
