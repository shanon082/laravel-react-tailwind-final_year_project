import { Card, CardContent, CardFooter } from '../../Components/Card';

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  iconBgColor,
  linkText,
  linkHref
}) => {
  return (
    <Card className="bg-white overflow-hidden shadow rounded-lg">
      <CardContent className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-3`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
            </dd>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-4 py-4 sm:px-6">
        <div className="text-sm">
          <a href={linkHref} className="font-medium text-primary hover:text-blue-600">
            {linkText}
          </a>
        </div>
      </CardFooter>
    </Card>
  );
};

export default StatsCard;