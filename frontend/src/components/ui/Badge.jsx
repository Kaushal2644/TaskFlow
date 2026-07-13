const statusStyles = {
  'Backlog':     'bg-slate-700 text-slate-300',
  'Todo':        'bg-blue-900 text-blue-300',
  'In Progress': 'bg-amber-900 text-amber-300',
  'Review':      'bg-purple-900 text-purple-300',
  'Done':        'bg-emerald-900 text-emerald-300',
};

const priorityStyles = {
  'Low':      'bg-emerald-900 text-emerald-300',
  'Medium':   'bg-amber-900 text-amber-300',
  'High':     'bg-orange-900 text-orange-300',
  'Critical': 'bg-red-900 text-red-300',
};

const Badge = ({ type = 'status', value }) => {
  const styles = type === 'status' ? statusStyles : priorityStyles;
  const style  = styles[value] || 'bg-slate-700 text-slate-300';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5
                      rounded-full text-xs font-medium ${style}`}>
      {value}
    </span>
  );
};

export default Badge;