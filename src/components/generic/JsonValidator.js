import Ajv from 'ajv';
import { cloneDeep } from 'lodash';

const jsonValidator = new Ajv({
    removeAdditional: "all",
});

export const validateJson = (schema, json) => {
    if (!schema || schema === '') return { valid: true, errors: null };
    const valid = jsonValidator.validate(schema, json ? cloneDeep(json) : {});
    return { valid: valid, errors: jsonValidator.errorsText() };
}