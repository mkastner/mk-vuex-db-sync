const Const = {
  Types: {
    None: -1,
    Once: 1,
    Start: 2,
    Stop: 3 
  }
};

// must be list because it must appear
// in this order
Const.Labels = [
  { key: Const.Types.None, label: 'nicht ausführen' },
  { key: Const.Types.Once, label: 'einmalig ausführen' },
  { key: Const.Types.Start, label:'Intvervall starten' },
  { key: Const.Types.Stop, label: 'Intervall anhalten' } 
];

Const.getLabel = function getLabel(type) {
  const item = Const.Labels.find(l => l.key === type);
  if (item) {
    return item.label; 
  }
};

export default Const;
