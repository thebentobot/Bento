import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { NextFunction, Request, RequestHandler, Response } from 'express';

export function mapClass(cls: ClassConstructor<object>): RequestHandler {
	return async (req: Request, res: Response, next: NextFunction) => {
		// Map to class
		const obj: object = plainToInstance(cls, req.body);

		// Validate class
		const errors = await validate(obj, {
			skipMissingProperties: true,
			whitelist: true,
			forbidNonWhitelisted: false,
			forbidUnknownValues: true,
		});
		if (errors.length > 0) {
			res.status(400).send({ error: true, errors: formatValidationErrors(errors) });
			return;
		}

		// Set validated class to locals
		res.locals.input = obj;
		next();
	};
}

interface ValidationErrorLog {
	property: string;
	constraints?: { [type: string]: string };
	children?: ValidationErrorLog[];
}

function formatValidationErrors(errors: ValidationError[] | undefined): ValidationErrorLog[] | undefined {
	if (errors) {
		return errors.map((error) => ({
			property: error.property,
			constraints: error.constraints,
			children: error.children?.length as number > 0 ? formatValidationErrors(error.children) : undefined,
		}));
	} else {
		return;
	}
}
