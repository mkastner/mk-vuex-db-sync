let Const = {
  Types: {
    None: -1,
    Once: 1,
    Start: 2,
    Stop: 3 
  }
};

Const.Labels = [
  { key: Const.Types.None, label: 'None' },
  { key: Const.Types.Once, label: 'Once' },
  { key: Const.Types.Start, label: 'Start Intverval' },
  { key: Const.Types.Stop, label: 'Stop Interval' } 
];

export default Const;
