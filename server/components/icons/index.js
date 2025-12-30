// 通用图标组件基类
export function IconBase({
    className = "w-5 h-5",
    fill = "none",
    stroke = "currentColor",
    strokeWidth = 2,
    viewBox = "0 0 24 24",
    children,
    ...props
}) {
    return (
        <svg
            className={className}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            viewBox={viewBox}
            {...props}
        >
            {children}
        </svg>
    );
}

// 导航图标
export function ArrowLeftIcon(props) {
    return (
        <IconBase {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </IconBase>
    );
}

export function CloseIcon(props) {
    return (
        <IconBase {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </IconBase>
    );
}

export function ChevronDownIcon(props) {
    return (
        <IconBase {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l-7 7-7-7m14-8l-7 7-7-7"/>
        </IconBase>
    );
}

// 设置图标
export function SettingsIcon(props) {
    return (
        <IconBase {...props}>
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </IconBase>
    );
}

// 媒体播放图标
export function PlayIcon(props) {
    return (
        <IconBase fill="currentColor" stroke="none" viewBox="0 0 20 20" {...props}>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
        </IconBase>
    );
}

export function PauseIcon(props) {
    return (
        <IconBase fill="currentColor" stroke="none" viewBox="0 0 20 20" {...props}>
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
        </IconBase>
    );
}

export function PlaySimpleIcon(props) {
    return (
        <IconBase fill="currentColor" stroke="none" viewBox="0 0 24 24" {...props}>
            <path d="M8 5v14l11-7z"/>
        </IconBase>
    );
}

// 文件类型图标
export function FolderIcon(props) {
    return (
        <IconBase fill="currentColor" stroke="none" viewBox="0 0 24 24" {...props}>
            <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
        </IconBase>
    );
}

export function MusicIcon(props) {
    return (
        <IconBase fill="currentColor" stroke="none" viewBox="0 0 24 24" {...props}>
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </IconBase>
    );
}

export function ImageIcon(props) {
    return (
        <IconBase {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </IconBase>
    );
}

export function VideoIcon(props) {
    return (
        <IconBase {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </IconBase>
    );
}

// 状态图标
export function LoadingIcon(props) {
    return <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 ${props.className || ''}`}></div>
}

export function FolderEmptyIcon(props) {
    return (
        <IconBase {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        </IconBase>
    );
}

// Toast/提示图标
export function CheckIcon(props) {
    return (
        <IconBase {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </IconBase>
    );
}

export function InfoIcon(props) {
    return (
        <IconBase {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </IconBase>
    );
}

export function WarningIcon(props) {
    return (
        <IconBase {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </IconBase>
    );
}

// 音频控制图标
export function VolumeIcon(props) {
    return (
        <IconBase fill="currentColor" stroke="none" viewBox="0 0 20 20" {...props}>
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.778L4.769 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.769l3.614-3.778a1 1 0 011.617-.146zM7 6.828L5.769 8H3v4h2.769L7 13.172V6.828zM15.95 4.343a1 1 0 00-1.414 1.414 5.5 5.5 0 010 7.778 1 1 0 101.414 1.414 7.5 7.5 0 000-10.606z" clipRule="evenodd"/>
            <path d="M13.536 6.757a1 1 0 00-1.414 1.414 1.5 1.5 0 010 2.121 1 1 0 101.414 1.415 3.5 3.5 0 000-4.95z"/>
        </IconBase>
    );
}

export function MoreIcon(props) {
    return (
        <IconBase fill="currentColor" stroke="none" viewBox="0 0 20 20" {...props}>
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
        </IconBase>
    );
}

// 音频播放器特定图标
export function PreviousIcon(props) {
    return (
        <IconBase fill="currentColor" stroke="none" viewBox="0 0 20 20" {...props}>
            <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/>
        </IconBase>
    );
}

export function NextIcon(props) {
    return (
        <IconBase fill="currentColor" stroke="none" viewBox="0 0 20 20" transform="rotate(180)" {...props}>
            <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/>
        </IconBase>
    );
}

export function ShuffleIcon(props) {
    return (
        <IconBase fill="currentColor" stroke="none" viewBox="0 0 20 20" {...props}>
            <path fillRule="evenodd" d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" clipRule="evenodd"/>
        </IconBase>
    );
}

export function RepeatIcon(props) {
    return (
        <IconBase fill="currentColor" stroke="none" viewBox="0 0 20 20" {...props}>
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
        </IconBase>
    );
}

// 页面特定图标
export function ArchiveIcon(props) {
    return (
        <IconBase {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
        </IconBase>
    );
}

export function ServerIcon(props) {
    return (
        <IconBase {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </IconBase>
    );
}

export function SpeakerIcon(props) {
    return (
        <IconBase fill="currentColor" stroke="none" viewBox="0 0 20 20" {...props}>
            <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd"/>
        </IconBase>
    );
}

export function ClipboardIcon(props) {
    return (
        <IconBase {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5a2 2 0 012-2h0a2 2 0 012 2v0"/>
        </IconBase>
    );
}
