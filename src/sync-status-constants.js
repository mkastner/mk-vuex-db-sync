const Const = {
  Types: {
    Error: -1,
    None: 0,
    Ongoing: 1,
    Started: 2,
    Finished: 3
  }
};

Const.Labels = {};

Const.Labels[Const.Types.Error] = 'Error';
Const.Labels[Const.Types.None] = 'None';
Const.Labels[Const.Types.Ongoing] = 'ongoing';
Const.Labels[Const.Types.Started] = 'Started';
Const.Labels[Const.Types.Finished] = 'Finished';

export default Const;

