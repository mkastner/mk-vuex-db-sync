const Const = {
  Types: {
    Error: -1,
    None: 0,
    Ongoing: 1,
    Started: 2,
    Success: 3
  }
};

Const.Labels = {};

Const.Labels[Const.Types.Error] = 'Fehler';
Const.Labels[Const.Types.None] = 'keine';
Const.Labels[Const.Types.Ongoing] = 'wird gerade ausgeführt';
Const.Labels[Const.Types.Started] = 'wurde gestartet';
Const.Labels[Const.Types.Success] = 'wurde erfolgreich durchgeführt';

export default Const;

