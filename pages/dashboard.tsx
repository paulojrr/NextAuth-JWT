import { useContext, useEffect } from 'react';
import { Can } from '../components/Can';
import { AuthContext, signOut } from '../contexts/AuthContext';
import { setupAPIClient } from '../services/api';
import { api } from '../services/apiClient';
import { withSSRAuth } from '../utils/withSSRAuth';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    api
      .get('/me')
      .then(response => console.log(response))
      .catch(err => console.log(err));
  }, []);

  return (
    <>
      <h1>Dashboard: {user?.email}</h1>

      <button onClick={signOut}>Sign out</button>
      <Can permissions={['metrics.list']}>
        <div>Métricas</div>
      </Can>
    </>
  );
};

export const getServerSideProps = withSSRAuth(async ctx => {
  const apiClient = setupAPIClient(ctx);

  await apiClient.get('/me');

  return {
    props: {},
  };
});

export default Dashboard;
