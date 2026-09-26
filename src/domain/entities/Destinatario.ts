import { EnderecoProps } from './Endereco';

export type DestinatarioProps = {
  readonly cpf?: string;
  readonly cnpj?: string;
  /** idEstrangeiro — documento do destinatario no exterior. Use no lugar de CNPJ/CPF. */
  readonly idEstrangeiro?: string;
  readonly nome: string;
  readonly email?: string;
  readonly inscricaoEstadual?: string;
  readonly indicadorIE: 1 | 2 | 9;
  /** ISUF — Inscricao na SUFRAMA, para operacao com Zona Franca / ALC. */
  readonly inscricaoSuframa?: string;
  /** IM — Inscricao Municipal, quando ha servico sujeito ao ISSQN. */
  readonly inscricaoMunicipal?: string;
  readonly endereco?: EnderecoProps;
};
