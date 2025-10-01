import { NotificationSettings } from "@/components/NotificationSettings";

const Settings = () => {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-gray-400 mt-1">
          Gerencie suas preferências e configurações do aplicativo.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6">
        <NotificationSettings />
        {/* Outras seções de configuração podem ser adicionadas aqui */}
      </section>
    </div>
  );
};

export default Settings;