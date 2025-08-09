import { useState, useCallback } from 'react';

export const useApi = (apiFunction) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiFunction(...args);
        setData(response.data);
        return response;
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Une erreur est survenue';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  return { data, error, loading, execute };
};

export const useApiMutation = (apiFunction) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const mutate = useCallback(
    async (payload) => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiFunction(payload);
        setData(response.data);
        return response;
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Une erreur est survenue';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  return { data, error, loading, mutate };
};
