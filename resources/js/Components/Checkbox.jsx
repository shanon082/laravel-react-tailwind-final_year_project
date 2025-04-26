export default function Checkbox({ className = '', checked, onCheckedChange, ...props }) {
    return (
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => {
                // Call onCheckedChange with the boolean value if provided
                if (onCheckedChange) {
                    onCheckedChange(e.target.checked);
                }
                // Also call any native onChange handler if provided
                if (props.onChange) {
                    props.onChange(e);
                }
            }}
            className={`rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 ${className}`}
            {...props}
        />
    );
}