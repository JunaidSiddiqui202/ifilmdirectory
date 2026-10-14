interface AILoadingStateProps {
    message?: string;
    subMessage?: string;
}

export default function AILoadingState({
    message = 'AI is working...',
    subMessage = 'This may take a few seconds'
}: AILoadingStateProps) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#231810] rounded-2xl p-8 shadow-2xl max-w-sm mx-4 animate-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center gap-4">
                    {/* Animated AI Icon */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
                        <div className="relative bg-gradient-to-r from-primary to-purple-600 rounded-full p-4">
                            <span className="material-symbols-outlined text-white text-5xl animate-pulse">
                                auto_awesome
                            </span>
                        </div>
                    </div>

                    {/* Loading Text */}
                    <div className="text-center">
                        <h3 className="text-black dark:text-white text-lg font-bold mb-1">
                            {message}
                        </h3>
                        <p className="text-gray-600 dark:text-[#cba990] text-sm">
                            {subMessage}
                        </p>
                    </div>

                    {/* Animated Dots */}
                    <div className="flex gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
