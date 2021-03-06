import { setupAPIClient } from '../services/api';
import { withSSRAuth } from '../utils/withSSRAuth';

const Metrics = () => {
  return (
    <>
      <h1>Metrics</h1>
    </>
  );
};

export const getServerSideProps = withSSRAuth(
  async ctx => {
    const apiClient = setupAPIClient(ctx);

    await apiClient.get('/me');

    return {
      props: {},
    };
  },
  {
    permissions: ['metrics.listx'],
    roles: ['administratorx'],
  }
);

export default Metrics;
