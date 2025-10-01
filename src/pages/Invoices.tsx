const Invoices = () => {
  return (
    <div>
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Faturas</h1>
          <p className="text-gray-400 mt-1">
            Gerencie as faturas dos seus cartões de crédito.
          </p>
        </div>
      </header>
      <div className="flex justify-center items-center h-64 bg-card rounded-lg">
        <p className="text-gray-400">
          A funcionalidade de faturas está em desenvolvimento.
        </p>
      </div>
    </div>
  );
};

export default Invoices;