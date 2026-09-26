// A labeled input, reused by any auth form field (username, email, password, ...)
function FormField({ id, label, type = 'text', placeholder, value, onChange }) {
    return (
        <>
            <label htmlFor={id}>{label}</label>
            <input
                id={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </>
    )
}

export default FormField
