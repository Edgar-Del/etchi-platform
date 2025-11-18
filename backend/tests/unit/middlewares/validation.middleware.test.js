const { handleValidationErrors } = require('../../../src/middlewares/validation.middleware');

// Mock manual do express-validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

const { validationResult } = require('express-validator');

describe('Validation Middleware', () => {
  const mockRequest = (body = {}) => ({ body });
  
  const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };
  
  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Deve chamar next() sem erros de validação', () => {
    // Mock: sem erros de validação
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });

    const req = mockRequest();
    const res = mockResponse();

    handleValidationErrors(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('Deve retornar erro 400 com erros de validação', () => {
    const validationErrors = [
      { 
        path: 'email', 
        msg: 'Email inválido', 
        value: 'email-ruim',
        location: 'body'
      }
    ];

    // Mock: com erros de validação
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => validationErrors
    });

    const req = mockRequest();
    const res = mockResponse();

    handleValidationErrors(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Dados de entrada inválidos',
      errors: expect.arrayContaining([
        expect.objectContaining({
          field: 'email',
          message: 'Email inválido'
        })
      ])
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});