import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
        
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <form onSubmit={submit}>
                <h1 className='mb-7 text-center text-2xl font-bold'>Login with University email</h1>
                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>
                {/* <div className="mt-4">
    <InputLabel htmlFor="role" value="Login as" />

    <select
        id="role"
        name="role"
        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        value={data.role}
        onChange={(e) => setData('role', e.target.value)}
        required
    >
        <option value="">Select a role</option>
        <option value="student">Student</option>
        <option value="lecturer">Lecturer</option>
        <option value="admin">Admin</option>
    </select>

    <InputError message={errors.role} className="mt-2" />
</div> */}


                <div className="mt-4 block">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                        />
                        <span className="ms-2 text-sm text-gray-600">
                            Remember me
                        </span>
                    </label>
                </div>

                <div className="mt-4 flex items-center justify-between mb-5">
                <Link
                        href={route('register')}
                        className="text-sm text-gray-600  hover:text-blue-600 hover:underline focus:outline-none"
                    >
                        New User!! Register
                    </Link>
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-sm text-gray-600 hover:underline  hover:text-blue-600 focus:outline-none"
                        >
                            Forgot your password?
                        </Link>
                    )}

                       </div>
                <PrimaryButton className="mt-4 bg-blue-500 items-end" disabled={processing}>
                    Log in
                </PrimaryButton>
            </form>
        </GuestLayout>
    );
}
