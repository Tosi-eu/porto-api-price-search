import {
  BadRequestException,
  PipeTransform,
  type ArgumentMetadata,
} from '@nestjs/common';
import type { z } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: z.ZodType) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      throw new BadRequestException({
        error: 'Corpo inválido',
        details: parsed.error.flatten(),
      });
    }
    return parsed.data;
  }
}
