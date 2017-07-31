import * as logger from 'winston';
import { main } from './app';

main().catch((error) => {
  logger.error(error.message);
});
