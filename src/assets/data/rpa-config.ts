import type { Motor, RpaConfigMap, RpaConfigEntry } from 'src/types';

// Mapeamento de queues do bhubot-backend para configuração do painel de execuções.
// Para adicionar um novo RPA: registrar aqui com motor, nome legível e responsável.

export const RPA_CONFIG: RpaConfigMap = {
  'emissao-iss-sp': {
    name: 'Geração Guia ISS — SP',
    shortName: 'ISS SP',
    motor: 'Fiscal',
    responsavel: 'Danilo',
  },
  'emissao-iss-sp-ultrafast': {
    name: 'Geração Guia ISS — SP (Ultrafast)',
    shortName: 'ISS SP',
    motor: 'Fiscal',
    responsavel: 'Danilo',
  },
  'gestta-express-uploader': {
    name: 'Upload Gestta Express',
    shortName: 'Gestta Upload',
    motor: 'Fiscal',
    responsavel: 'Danilo',
  },
  'fgts-emissao-guia': {
    name: 'FGTS Digital',
    shortName: 'FGTS',
    motor: 'DP',
    responsavel: 'BHub',
  },
  'dp-admissao': {
    name: 'Admissão — DP',
    shortName: 'Admissão',
    motor: 'DP',
    responsavel: 'BHub',
  },
  'poc-rpa-engine-danilo-queue': {
    name: 'SPED ERS Agrocontar',
    shortName: 'SPED ERS',
    motor: 'Fiscal',
    responsavel: 'Guilherme Santos',
  },
};

export const MOTORES: Motor[] = ['Fiscal', 'DP'];

export const MOTOR_COLOR: Record<Motor, string> = {
  Fiscal: 'primary',
  DP: 'secondary',
};

export type { RpaConfigEntry };
