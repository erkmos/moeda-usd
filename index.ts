import * as logger from 'winston';
import { main } from './src/app';

main().catch((error) => {
  logger.error(error.message);
});
