import NextImage, {ImageProps as NextImageProps} from 'next/image'

const customLoader = ({src}: {src: string}) => {
	return `${src}`
}

interface ImageProps extends NextImageProps {
	src: string
}

export default function Image(props: ImageProps) {
	return (
		<NextImage
			{...props}
			loader={customLoader}
		/>
	)
}
