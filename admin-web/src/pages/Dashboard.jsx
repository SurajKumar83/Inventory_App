import useAuthStore from "../../../shared/stores/authStore.js";
import OverviewMetrics from "../components/dashboard/OverviewMetrics.jsx";
import Layout from "../components/layout/Layout.jsx";

export default function Dashboard() {
  const { user } = useAuthStore();

  return (
    <Layout title="Manage Your Two Shops">
      <OverviewMetrics />
    </Layout>
  );
}
