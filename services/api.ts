import axios, { AxiosError } from 'axios';
import { parseCookies, setCookie } from 'nookies';
import { signOut } from '../contexts/AuthContext';

let isRefreshing = false;
let failedRequestsQueue = [];

export const setupAPIClient = (ctx = undefined) => {
  let cookies = parseCookies(ctx);

  const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
      Authorization: `Bearer ${cookies['nextauth.token']}`,
    },
  });

  // Intercepta a resposta e realiza uma ação com base nela
  api.interceptors.response.use(
    response => {
      return response;
    },
    (error: AxiosError) => {
      if (error.response.status === 401) {
        if (error.response.data?.code === 'token.expired') {
          // Atualiza os cookies com as informações mais recentes
          cookies = parseCookies(ctx);

          // Pega o refreshToken de dentro dos cookies
          const { 'nextauth.refreshToken': refreshToken } = cookies;

          // Armazena todos os dados da requisição para
          // refazer a requisição
          const originalConfig = error.config;

          // Quando receber o token expirado, realiza ação de refresh.
          // Irá realizar a validação somente uma vez independente de quantas
          // chamadas sejam feitas para o refresh até o token estar válido
          if (!isRefreshing) {
            isRefreshing = true;

            api
              .post('/refresh', {
                refreshToken,
              })
              .then(response => {
                const { token } = response.data;

                // Adiciona nos cookies o novo token
                setCookie(ctx, 'nextauth.token', token, {
                  maxAge: 60 * 60 * 24 * 30,
                  path: '/',
                });

                // Adiciona nos cookies o novo refreshToken
                setCookie(
                  ctx,
                  'nextauth.refreshToken',
                  response.data.refreshToken,
                  {
                    maxAge: 60 * 60 * 24 * 30,
                    path: '/',
                  }
                );

                api.defaults.headers['Authorization'] = `Bearer ${token}`;

                // Refaz as requisições que falharam utilizando o novo token
                failedRequestsQueue.forEach(request =>
                  request.onSuccess(token)
                );
                failedRequestsQueue = [];
              })
              .catch(err => {
                failedRequestsQueue.forEach(request => request.onFailure(err));
                failedRequestsQueue = [];

                if (process.browser) {
                  signOut();
                }
              })
              .finally(() => {
                isRefreshing = false;
              });
          }

          return new Promise((resolve, reject) => {
            failedRequestsQueue.push({
              onSuccess: (token: string) => {
                // Atualiza o header da requisição com o novo token
                originalConfig.headers['Authorization'] = `Bearer ${token}`;

                // Realiza uma nova requisição com o token atualizado
                resolve(api(originalConfig));
              },
              onFailure: (err: AxiosError) => {
                reject(err);
              },
            });
          });
        } else {
          if (process.browser) {
            signOut();
          }
        }
      }
      return Promise.reject(error);
    }
  );

  return api;
};
