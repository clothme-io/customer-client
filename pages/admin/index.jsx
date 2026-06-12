export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/admin/blog",
      permanent: false
    }
  };
}

export default function AdminIndexPage() {
  return null;
}
