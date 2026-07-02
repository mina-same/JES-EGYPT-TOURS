import Image from "next/image";

type AspectRatio = "16:9" | "4:3" | "3:2" | "3:4" | "auto";
type Fit = "cover" | "contain";
type Focus =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "center-top"
  | "center-bottom";

interface BlogImageProps {
  src: string;
  alt: string;
  title?: string;
  caption?: string;
  aspectRatio?: AspectRatio;
  fit?: Fit;
  focus?: Focus;
  className?: string;
}

const ASPECT_RATIO_CSS: Record<Exclude<AspectRatio, "auto">, string> = {
  "16:9": "16 / 9",
  "4:3": "4 / 3",
  "3:2": "3 / 2",
  "3:4": "3 / 4",
};

const OBJECT_POSITION: Record<Focus, string> = {
  center: "center center",
  top: "center top",
  bottom: "center bottom",
  left: "left center",
  right: "right center",
  "center-top": "center 20%",
  "center-bottom": "center 80%",
};

const BlogImage: React.FC<BlogImageProps> = ({
  src,
  alt,
  title,
  caption,
  aspectRatio = "16:9",
  fit = "cover",
  focus = "center",
  className,
}) => {
  const objectPosition = OBJECT_POSITION[focus];
  const isPortrait = aspectRatio === "3:4";

  return (
    <figure
      style={{
        margin: isPortrait ? "0 auto" : 0,
        maxWidth: isPortrait ? "640px" : undefined,
        width: "100%",
      }}
      className={className}
    >
      {aspectRatio === "auto" ? (
        <div
          style={{
            borderRadius: "10px",
            overflow: "hidden",
            background: "#f0ece4",
            lineHeight: 0,
          }}
        >
          <Image
            src={src}
            alt={alt}
            title={title || undefined}
            width={1200}
            height={900}
            style={{
              width: "100%",
              height: "auto",
              objectFit: fit,
              objectPosition,
              display: "block",
            }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 900px"
          />
        </div>
      ) : (
        <div
          style={{
            position: "relative",
            aspectRatio: ASPECT_RATIO_CSS[aspectRatio],
            borderRadius: "10px",
            overflow: "hidden",
            background: "#f0ece4",
            width: "100%",
          }}
        >
          <Image
            src={src}
            alt={alt}
            title={title || undefined}
            fill
            style={{ objectFit: fit, objectPosition }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 900px"
          />
        </div>
      )}

      {caption && (
        <figcaption
          style={{
            textAlign: "center",
            fontSize: "0.875rem",
            color: "#888",
            marginTop: "0.6rem",
            fontStyle: "italic",
            lineHeight: 1.5,
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

export default BlogImage;
